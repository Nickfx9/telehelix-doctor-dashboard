import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebaseClient.js"; // This replaces the two separate imports
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, doc, updateDoc, getDoc } from "firebase/firestore";
import "./Messages.css";

export default function Messages() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [patientTyping, setPatientTyping] = useState(false);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  const doctorUid = localStorage.getItem("doctorUid");
  const scrollRef = useRef();

  // Fetch unique patients with real names from Firestore
  useEffect(() => {
    if (!doctorUid) return;
    const q = query(collection(db, "appointments"), where("doctorId", "==", doctorUid));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const unique = {};
      for (let d of snapshot.docs) {
        const data = d.data();
        if (!unique[data.patientId]) {
          // Try to fetch real patient name from users collection if available
          let patientName = data.patientName || "Patient";
          try {
            const patientDoc = await getDoc(doc(db, "users", data.patientId));
            if (patientDoc.exists()) {
              patientName = patientDoc.data().fullName || patientName;
            }
          } catch (err) {
            console.error("Error fetching patient name:", err);
          }
          unique[data.patientId] = { id: data.patientId, name: patientName };
        }
      }
      setPatients(Object.values(unique));
    });
    return () => unsubscribe();
  }, [doctorUid]);

  // Stream messages & typing status
  useEffect(() => {
    if (!selectedPatient || !doctorUid) return;
    const ids = [doctorUid, selectedPatient.id].sort();
    const roomId = `chat_${ids.join("_")}`;

    const resetUnread = async () => {
      try {
        await updateDoc(doc(db, "community_chats", roomId), { unreadCount: 0 });
      } catch (err) {
        console.error("Failed to reset unread count:", err);
      }
    };
    resetUnread();

    const qMsg = query(collection(db, `community_chats/${roomId}/messages`), orderBy("timestamp", "asc"));
    const unsubMsg = onSnapshot(qMsg, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    const unsubTyping = onSnapshot(doc(db, "community_chats", roomId), (d) => {
      if (d.exists()) setPatientTyping(d.data().isPatientTyping);
    });

    return () => { unsubMsg(); unsubTyping(); };
  }, [selectedPatient, doctorUid]);

  const handleTypingStatus = async (isTyping) => {
    if (!selectedPatient || !doctorUid) return;
    const ids = [doctorUid, selectedPatient.id].sort();
    const roomId = `chat_${ids.join("_")}`;
    try {
      await updateDoc(doc(db, "community_chats", roomId), { isDoctorTyping: isTyping });
    } catch (err) {
      console.error("Typing status update failed", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    
    // 1. Validation: Don't send empty messages or if no patient is selected
    if (!newMessage.trim() || !selectedPatient || !doctorUid) return;
    
    const messageText = newMessage.trim();
    const ids = [doctorUid, selectedPatient.id].sort();
    const roomId = `chat_${ids.join("_")}`;

    try {
      // 2. GET THE SECURITY TOKEN (Forces a fresh one to avoid 401s)
      const token = await auth.currentUser.getIdToken(true);
      
      // 3. SAVE TO FIRESTORE (The Chat History for the UI)
      await addDoc(collection(db, `community_chats/${roomId}/messages`), {
        senderId: doctorUid,
        senderName: "Doctor", 
        senderRole: "doctor",
        receiverId: selectedPatient.id,
        text: messageText,
        timestamp: serverTimestamp(),
        type: 'text'
      });

      // 4. TRIGGER BACKEND NOTIFICATION (Cloud Run Call)
      fetch('https://telehelix-backend-471218709027.us-central1.run.app/api/appointments/send-chat-notification', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
     receiverId: selectedPatient.id,
    // This version removes the extra "Dr." and just sends the clean name
    senderName: auth.currentUser?.displayName || "Telehelix Provider", 
    senderId: doctorUid, 
    text: messageText
   })
      })
      .then(res => res.json())
      .then(data => {
        console.log("Backend Response:", data);
        if (data.error) console.error("Backend logic error:", data.error);
      })
      .catch(err => console.error("Notification failed:", err));

      // 5. CLEAN UP THE UI
      setNewMessage("");
      if (typeof handleTypingStatus === 'function') handleTypingStatus(false);

    } catch (err) {
      console.error("Critical Error in handleSend:", err);
      alert("Could not send message. Please try again.");
    }
  };
  const selectPatient = (p) => {
    setSelectedPatient(p);
    setIsMobileListOpen(false);
  };

  return (
    <div className="inbox-main-wrapper">
      {/* SIDEBAR: PATIENT DIRECTORY */}
      <div className={`inbox-sidebar ${!isMobileListOpen ? 'mobile-hide' : ''}`}>
        <div className="sidebar-header-clinical">
           <h2>Patients</h2>
           <p>Active Patient Threads</p>
        </div>
        <div className="patient-list">
          {patients.map(p => (
            <div key={p.id} className={`patient-tile-clinical ${selectedPatient?.id === p.id ? 'active' : ''}`} onClick={() => selectPatient(p)}>
              <div className="avatar-clinical">{p.name.charAt(0)}</div>
              <div className="meta">
                <h4>{p.name}</h4>
                <p>Verified Patient</p>
              </div>
              {selectedPatient?.id === p.id && <div className="active-indicator"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className={`inbox-chat-area ${isMobileListOpen ? 'mobile-hide' : ''}`}>
        {selectedPatient ? (
          <>
            <div className="chat-header-clinical">
              <button className="back-btn-clinical" onClick={() => setIsMobileListOpen(true)}>←</button>
              <div className="header-info-clinical">
                <h3>{selectedPatient.name}</h3>
                <div className="status-row">
                  <span className={`status-dot ${patientTyping ? 'pulse' : 'online'}`}></span>
                  <span className="status-text-clinical">
                    {patientTyping ? "Patient is typing..." : "Secure HIPAA Channel"}
                  </span>
                </div>
              </div>
            </div>

            <div className="messages-stream-clinical">
              <div className="encryption-banner">
                🔒 Technical Advisory: This conversation is end-to-end encrypted.
              </div>
              {messages.map((m, i) => (
                <div key={i} className={`msg-row ${m.senderId === doctorUid ? 'me' : 'them'}`}>
                   <div className={`msg-bubble-clinical ${m.type === 'image' ? 'image-content' : ''}`}>
                    {m.type === 'image' ? (
                      <div className="chat-image-container-clinical">
                        <img 
                          src={m.imageUrl} 
                          alt="Clinical attachment" 
                          className="clinical-attachment-img" 
                          onClick={() => window.open(m.imageUrl, '_blank')}
                        />
                        <span className="expand-hint-clinical">Click to view full specimen</span>
                      </div>
                    ) : (
                      <p>{m.text}</p>
                    )}
                  </div>
                </div>
              ))}

              {patientTyping && (
                <div className="msg-row them">
                  <div className="typing-indicator-clinical">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            <form className="chat-input-clinical" onSubmit={handleSend}>
              <div className="input-container-clinical">
                <input 
                  value={newMessage} 
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTypingStatus(e.target.value.length > 0);
                  }}
                  onBlur={() => handleTypingStatus(false)}
                  placeholder="Type professional medical advice..." 
                />
                <button type="submit" className="send-btn-clinical">Send</button>
              </div>
            </form>
          </>
        ) : (
          <div className="empty-state-clinical">
            <div className="empty-icon-clinical">💬</div>
            <h3>TeleHelix Patient Hub</h3>
            <p>Please select a patient thread to begin messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}