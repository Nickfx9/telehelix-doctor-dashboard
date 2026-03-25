import React, { useEffect, useState } from "react";
import { db } from "../firebaseClient.js"; // Ensure your firebase config is imported
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import "./Queue.css"; // We'll add some futuristic styling

export default function Queue({ onStartCall }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const BACKEND_URL = "https://telehelix-backend-471218709027.us-central1.run.app";

  // 1. LIVE LISTENER: Catching requests the millisecond they are created
  useEffect(() => {
    const doctorUid = localStorage.getItem("doctorUid"); 
    
    if (!doctorUid) {
        console.error("Doctor UID not found in storage");
        setLoading(false);
        return;
    }

    const q = query(
      collection(db, "consultations"),
      where("doctorId", "==", doctorUid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incoming = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(incoming);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup
  }, []);

  // 2. ACCEPT LOGIC: Triggering your Node.js Handshake
  const handleAccept = async (requestId) => {
    try {
      const token = localStorage.getItem("authToken");
      
      const res = await fetch(`${BACKEND_URL}/api/consultations/accept`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ sessionId: requestId })
      });
// --- UPDATED BLOCK STARTS HERE ---
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Acceptance failed");
      
      // We must pass 'uid' because the token is locked to that specific number
      onStartCall({
        appId: data.appId, 
        token: data.token,
        channelName: data.channelName,
        uid: data.uid, // <--- CRITICAL: Capture the UID from the backend
      });

    } catch (err) {
      alert("Error accepting request: " + err.message);
    }
  };
  // --- UPDATED BLOCK ENDS HERE ---

  if (loading) return <div className="queue-loader">Synchronizing with Helix Cloud...</div>;

  return (
    <div className="queue-container">
      <div className="queue-header">
        <div className="header-text">
          <h2>Incoming Consultations</h2>
          <p>Real-time triage from TeleHelix Patient App</p>
        </div>
        <div className="count-badge">{requests.length} Requests</div>
      </div>

      <div className="request-list">
        {requests.map((req) => (
          <div key={req.id} className="request-card incoming-pulse">
            <div className="card-top">
              <div className="patient-meta">
                <div className="patient-avatar">{req.patientName?.[0] || "P"}</div>
                <div>
                  <h4>{req.patientName || "Anonymous Patient"}</h4>
                  <span className="mode-tag">{req.mode?.toUpperCase()}</span>
                </div>
              </div>
              <div className="timestamp">Just now</div>
            </div>

            <div className="card-body">
              <div className="symptom-box">
                <label>Symptoms / Reason:</label>
                <p>{req.symptoms || "No details provided"}</p>
              </div>
              {req.specialty && (
                <span className="specialty-pill">{req.specialty}</span>
              )}
            </div>

            <div className="card-actions">
              <button 
                className="accept-request-btn"
                onClick={() => handleAccept(req.id)}
              >
                Accept & Join Room
              </button>
              <button className="decline-btn">Decline</button>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="empty-state">
            <div className="radar-icon">📡</div>
            <p>Scanning for incoming patient requests...</p>
          </div>
        )}
      </div>
    </div>
  );
}