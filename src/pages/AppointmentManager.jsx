import React, { useEffect, useState } from "react";
import { db } from "../firebaseClient.js";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import VideoRoom from "../features/VideoRoom/VideoRoom.jsx";
import "./AppointmentManager.css";

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // VIDEO STATE
  const [inCall, setInCall] = useState(false);
  const [callData, setCallData] = useState(null);

  const BACKEND_URL = "https://telehelix-backend-471218709027.us-central1.run.app";

  useEffect(() => {
    const doctorUid = localStorage.getItem("doctorUid");
    if (!doctorUid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "appointments"),
      where("doctorId", "==", doctorUid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(docs);
      setLoading(false);
    }, (err) => {
      console.error("Fetch Error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${BACKEND_URL}/api/appointments/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ appointmentId, status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      alert(`Appointment ${newStatus}!`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // NEW: Function to trigger the video session
  const startCall = async (appointmentId) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${BACKEND_URL}/api/appointments/start-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ appointmentId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start session");

      // data expected: { appId, token, channelName, uid }
      setCallData(data);
      setInCall(true);
    } catch (err) {
      alert("Call Error: " + err.message);
    }
  };

  if (loading) return <div className="queue-loader">Loading Helix Schedule...</div>;

  // VIDEO OVERLAY LOGIC
  if (inCall && callData) {
    return (
      <VideoRoom
        appId={callData.appId}
        token={callData.token}
        channelName={callData.channelName}
        uid={callData.uid}
        onEndCall={() => {
          setInCall(false);
          setCallData(null);
        }}
      />
    );
  }

  const pending = appointments.filter(a => a.status === "pending");
  const upcoming = appointments.filter(a => a.status === "confirmed" || a.status === "ongoing");

  return (
    <div className="appointment-manager">
      <div className="manager-header">
        <h1>Schedule & Bookings</h1>
        <p>Manage your upcoming patient slots</p>
      </div>

      <div className="appointment-grid">
        <div className="appointment-column">
          <div className="column-title">
             <h3>Pending Requests <span className="badge">{pending.length}</span></h3>
          </div>
          {pending.map(req => (
            <div key={req.id} className="request-card pending-border">
              <div className="card-header">
                <div className="patient-info">
                   <div className="patient-avatar-sm">{req.patientName?.[0] || "P"}</div>
                   <div>
                     <h4>{req.patientName}</h4>
                     <p className="visit-reason">Reason: {req.symptoms}</p>
                   </div>
                </div>
              </div>
              <div className="slot-detail">
                <span className="date-tag">🗓 {req.date}</span>
                <span className="time-tag">🕒 {req.startTime}</span>
              </div>
              <div className="action-row">
                <button className="accept-btn" onClick={() => updateStatus(req.id, "confirmed")}>Confirm</button>
                <button className="decline-btn" onClick={() => updateStatus(req.id, "cancelled")}>Decline</button>
              </div>
            </div>
          ))}
          {pending.length === 0 && <p className="empty-msg">No new booking requests.</p>}
        </div>

        <div className="appointment-column">
          <div className="column-title">
             <h3>Upcoming Schedule <span className="badge confirm-bg">{upcoming.length}</span></h3>
          </div>
          {upcoming.map(item => (
            <div key={item.id} className="request-card confirmed-border">
              <div className="confirmed-header">
                <strong>{item.startTime}</strong> - {item.patientName}
                <span className={`mode-pill ${item.status === 'ongoing' ? 'live-status' : ''}`}>
                  {item.status === 'ongoing' ? "LIVE" : item.mode}
                </span>
              </div>
              <p className="date-subtext">{item.date} • {item.specialty}</p>
              <div className="confirmed-actions">
                 <button 
                   className={item.status === 'ongoing' ? "start-btn-sm ongoing-bg" : "start-btn-sm"}
                   onClick={() => startCall(item.id)}
                   disabled={item.date !== new Date().toISOString().split('T')[0]}
                 >
                   {item.status === 'ongoing' ? "Rejoin Call" : "Ready to Start"}
                 </button>
              </div>
            </div>
          ))}
          {upcoming.length === 0 && <p className="empty-msg">No confirmed appointments yet.</p>}
        </div>
      </div>
    </div>
  );
}