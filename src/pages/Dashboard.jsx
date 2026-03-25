import React, { useEffect, useState } from "react";
import { db } from "../firebaseClient.js";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import "./Dashboard.css";

// 1. IMPORT THE VIDEO COMPONENT
import VideoRoom from "../features/VideoRoom/VideoRoom.jsx";

import Queue from "./Queue";
import Messages from "./message";
import Patients from "./patient";
import Setting from "./setting";
import ScheduleManager from "./ScheduleManager";
import AppointmentManager from "./AppointmentManager";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Queue");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const [inCall, setInCall] = useState(false);
  const [callData, setCallData] = useState(null);

  const [username, setUsername] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);

  const BACKEND_URL =
    "https://telehelix-backend-471218709027.us-central1.run.app";

  // --- 1. PERSISTENCE LOGIC: Restore call on refresh ---
  useEffect(() => {
    const savedCall = localStorage.getItem("activeCall");
    if (savedCall) {
      try {
        const data = JSON.parse(savedCall);
        setCallData(data);
        setInCall(true);
      } catch (err) {
        console.error("Failed to restore call session:", err);
        localStorage.removeItem("activeCall");
      }
    }
  }, []);

  // Prevent background scrolling when in a video call
  useEffect(() => {
    if (inCall) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [inCall]);

  // --- 2. UNREAD MESSAGES LISTENER ---
  useEffect(() => {
    const doctorUid = localStorage.getItem("doctorUid");
    if (!doctorUid) return;

    const q = query(
      collection(db, "community_chats"),
      where("doctorId", "==", doctorUid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        let total = 0;
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          total += data.unreadCount || 0;
        });
        setUnreadCount(total);
      },
      (err) => console.error("Unread listener error:", err)
    );

    return () => unsubscribe();
  }, []);

  // --- 3. FIRESTORE PRESENCE PULSE (For Flutter Consult Now) ---
  useEffect(() => {
    const doctorUid = localStorage.getItem("doctorUid");
    if (!doctorUid) return;

    const docRef = doc(db, "doctors", doctorUid);

    const updatePresence = async (status) => {
      try {
        await updateDoc(docRef, {
          isOnline: status,
          lastPresence: serverTimestamp(),
        });
      } catch (err) {
        console.error("Presence sync failed", err);
      }
    };

    // Set online immediately
    updatePresence(true);

    // Pulse every 30s to keep "lastPresence" fresh for the Patient's "secs ago" UI
    const interval = setInterval(() => updatePresence(true), 30000);

    // Cleanup: Set offline when tab is closed or component unmounts
    return () => {
      clearInterval(interval);
      updatePresence(false);
    };
  }, []);

  // --- 4. EMERGENCY REQUEST LISTENER (Consult Now) ---
  useEffect(() => {
    const doctorUid = localStorage.getItem("doctorUid");
    if (!doctorUid || inCall) return;

    // Listen for new "pending" consultations assigned to this doctor
    const q = query(
      collection(db, "consultations"),
      where("doctorId", "==", doctorUid),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const request = snapshot.docs[0].data();
        // Trigger high-priority UI reaction
        if (activeTab !== "Queue") {
          alert(`🚨 EMERGENCY: New ${request.mode} request from ${request.patientName || "Patient"}`);
          setActiveTab("Queue");
        }
      }
    });

    return () => unsubscribe();
  }, [activeTab, inCall]);

  // --- 5. MASTER CONSULTATION HANDLERS ---
  const startConsultation = async (data) => {
    const sessionId = data.sessionId || data.channelName;
    if (!sessionId) return;

    try {
      const sessionRef = doc(db, "appointments", sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (sessionSnap.exists() && sessionSnap.data().status === "ended") {
          alert("This consultation has already been closed.");
          return;
      }

      await updateDoc(sessionRef, {
        status: "ongoing",
        doctorJoinedAt: serverTimestamp(),
      });
      
      setCallData(data);
      setInCall(true);
      localStorage.setItem("activeCall", JSON.stringify(data));
      console.log(`🚀 Consultation started: appointments/${sessionId}`);
    } catch (err) {
      console.error("Critical: Failed to sync start state", err);
      setCallData(data);
      setInCall(true);
    }
  };

  const endConsultation = async () => {
    try {
      const sessionId = callData?.sessionId || callData?.channelName;
      if (sessionId) {
        const sessionRef = doc(db, "appointments", sessionId);
        await updateDoc(sessionRef, {
          status: "ended",
          endedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error("Critical: Failed to sync end state", err);
    } finally {
      setInCall(false);
      setCallData(null);
      localStorage.removeItem("activeCall");
    }
  };

  const handleNavClick = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Queue":
        return <Queue onStartCall={startConsultation} />;
      case "Bookings":
        return <AppointmentManager />;
      case "Messages":
        return <Messages />;
      case "Patients":
        return <Patients />;
      case "Schedule":
        return <ScheduleManager backendUrl={BACKEND_URL} />;
      case "Settings":
        return <Setting doctor={doctor} />;
      default:
        return <Queue onStartCall={startConsultation} />;
    }
  };

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const res = await fetch(`${BACKEND_URL}/api/doctors/profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to fetch doctor profile");

        const data = await res.json();

        setDoctor({
          uid: data.uid,
          fullName: data.name,
          username: data.username || "",
          specialty: data.specialty,
          bio: data.bio,
          profileImage: data.image || null,
          verificationStatus: data.verificationStatus || "pending",
        });

        setUsername(data.username || "");
        setSpecialty(data.specialty || "");
        setBio(data.bio || "");
      } catch (err) {
        console.error("Doctor fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorProfile();
  }, []);

  const handleImageUpload = (file) => {
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    const finalUsername = username.trim() || doctor?.username;
    const finalSpecialty = specialty.trim() || doctor?.specialty;
    const finalBio = bio.trim() || doctor?.bio;

    if (!finalUsername || !finalSpecialty) {
      alert("Username and Specialty are required!");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const formData = new FormData();
      formData.append("username", finalUsername);
      formData.append("specialization", finalSpecialty);
      formData.append("bio", finalBio);

      if (profileImage) formData.append("image", profileImage);

      const res = await fetch(`${BACKEND_URL}/api/doctors/profile/update`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to save profile");

      const updatedData = await res.json();

      setDoctor((prev) => ({
        ...prev,
        username: updatedData.username || finalUsername,
        specialty: updatedData.specialization || finalSpecialty,
        bio: updatedData.bio || finalBio,
        profileImage:
          updatedData.image || updatedData.profileImage || prev.profileImage,
      }));

      setEditingProfile(false);
      setProfileImage(null);
      setImagePreview(null);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Save profile error:", err);
      alert("Failed to save profile. Try again.");
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading TeleHelix Workspace...</div>;
  }

  const isMessagesActive = activeTab === "Messages";

  return (
    <div
      className={`telehelix-layout tab-${activeTab.toLowerCase()} ${
        isMessagesActive ? "messages-view-active" : ""
      } ${inCall ? "incall-active" : ""}`}
    >
      {inCall && callData && (
        <div className="video-consultation-suite">
          <VideoRoom
            appId={callData.appId}
            token={callData.token}
            channelName={callData.channelName}
            uid={callData.uid}
            onEndCall={endConsultation}
          />
        </div>
      )}

      {!isMessagesActive && !inCall && (
        <header className="view-header">
          <button
            className="fab-menu"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            ☰
          </button>
          <div className="header-flex">
            <h1>{activeTab}</h1>
            <div className="dr-status-pill">
              <span className="dot online"></span>
              Dr. {doctor?.fullName?.split(" ")[0] || "User"} (Live)
            </div>
          </div>
        </header>
      )}

      <aside className={`glass-sidebar ${sidebarOpen && !inCall ? "show" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-helix">Helix<span>Doc</span></div>
          <button className="close-btn" onClick={() => setSidebarOpen(false)}>
            ✕
          </button>
        </div>

        <div className="sidebar-identity-card futuristic-theme">
          <div className="profile-image-container">
            <div
              className="profile-circle-wrapper"
              onClick={() => document.getElementById("profileUpload").click()}
            >
              <img
                src={
                  imagePreview ||
                  doctor?.profileImage ||
                  "https://via.placeholder.com/150"
                }
                alt="Doctor"
                className="profile-avatar-img"
              />
              <div className="avatar-hover-overlay">
                <span>{imagePreview ? "Change Photo" : "Upload Photo"}</span>
              </div>
            </div>

            <input
              type="file"
              id="profileUpload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => handleImageUpload(e.target.files[0])}
            />
          </div>

          {imagePreview && !editingProfile && (
            <div className="image-save-notice">
              <button className="save-photo-btn" onClick={handleSaveProfile}>
                Save New Photo
              </button>
              <button
                className="cancel-photo-btn"
                onClick={() => {
                  setImagePreview(null);
                  setProfileImage(null);
                }}
              >
                Discard
              </button>
            </div>
          )}

          {editingProfile ? (
            <div className="profile-edit-form">
              <input
                type="text"
                value={username}
                placeholder="Username"
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="text"
                value={specialty}
                placeholder="Specialty"
                onChange={(e) => setSpecialty(e.target.value)}
              />
              <textarea
                value={bio}
                placeholder="Professional Bio"
                onChange={(e) => setBio(e.target.value)}
              />
              <div className="edit-actions">
                <button className="save-btn" onClick={handleSaveProfile}>
                  Update All
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setEditingProfile(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <div className="name-verify-row">
                <h3>Dr. {doctor?.fullName}</h3>
                {doctor?.verificationStatus === "verified" && (
                  <span className="verified-badge">verified</span>
                )}
              </div>
              <span className="doctor-handle">
                @{doctor?.username || "medical_pro"}
              </span>
              <div className="specialty-tag">{doctor?.specialty || "Specialist"}</div>
              <p className="bio-preview">{doctor?.bio || "No professional bio set yet."}</p>

              <button
                className="edit-profile-btn"
                onClick={() => setEditingProfile(true)}
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        <nav className="nav-links">
          <button
            className={activeTab === "Queue" ? "active" : ""}
            onClick={() => handleNavClick("Queue")}
          >
            🕒 Waiting Queue
          </button>
          <button
            className={activeTab === "Bookings" ? "active" : ""}
            onClick={() => handleNavClick("Bookings")}
          >
            📅 Appt Bookings
          </button>
          <button
            className={activeTab === "Schedule" ? "active" : ""}
            onClick={() => handleNavClick("Schedule")}
          >
            ⚙️ Weekly Template
          </button>
          <button
            className={activeTab === "Patients" ? "active" : ""}
            onClick={() => handleNavClick("Patients")}
          >
            👥 My Patients
          </button>

          <button
            className={`nav-msg-btn ${activeTab === "Messages" ? "active" : ""}`}
            onClick={() => handleNavClick("Messages")}
          >
            <div className="nav-btn-content">
              <span>💬 Consult Chat</span>
              {unreadCount > 0 && <span className="sidebar-badge-bubble">{unreadCount}</span>}
            </div>
          </button>

          <button
            className={activeTab === "Settings" ? "active" : ""}
            onClick={() => handleNavClick("Settings")}
          >
            ⚙️ App Settings
          </button>
        </nav>
      </aside>

      {sidebarOpen && !inCall && <div className="blur-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className={`viewport-content ${isMessagesActive || inCall ? "fullscreen-inbox" : ""}`}>
        <section className={`scrollable-content ${(isMessagesActive || inCall) ? "no-scroll-dashboard" : ""}`}>
          {renderContent()}
        </section>
      </main>
    </div>
  );
}