import React, { useState, useEffect, useMemo } from "react";
import AgoraRTC, {
  AgoraRTCProvider,
  useJoin,
  useLocalCameraTrack,
  useLocalMicrophoneTrack,
  useLocalScreenTrack,
  usePublish,
  useRemoteUsers,
  RemoteUser,
  LocalVideoTrack,
  useRTCClient,
} from "agora-rtc-react";
import { db } from "../../firebaseClient"; // Ensure this path matches your project structure
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import "./VideoRoom.css";

// 1. Create a stable client outside the component
const agoraClient = AgoraRTC.createClient({ codec: "vp8", mode: "rtc" });

function VideoCallContent({ appId, channelName, token, uid, onEndCall }) {
  const [micOn, setMic] = useState(true);
  const [videoOn, setVideo] = useState(true);
  const [screenShareOn, setScreenShareOn] = useState(false);
  
  // --- NEW: RECONNECTION STATE ---
  const [connectionStatus, setConnectionStatus] = useState("CONNECTED");

  // 2. Initialize Microphone
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);

  // 3. Initialize Camera with STRICT encoder config
  const { localCameraTrack } = useLocalCameraTrack(videoOn, {
    encoderConfig: {
      width: 640,
      height: 480,
      frameRate: 15,
      bitrateMin: 400,
      bitrateMax: 1000,
    },
  });
  
  // Initialize Screen Share
  const { screenTrack, error: screenError } = useLocalScreenTrack(screenShareOn, {}, "disable");

  // 4. Ensure numeric UID
  const numericUid = useMemo(() => Number(uid) || 1, [uid]);

  // 5. Join the Channel
  useJoin({ 
    appid: appId, 
    channel: channelName, 
    token: token, 
    uid: numericUid 
  }, !!(appId && token && channelName));

  const remoteUsers = useRemoteUsers();

  // --- NEW: CONNECTION WATCHER ---
  useEffect(() => {
    const handleStateChange = (curState) => {
      setConnectionStatus(curState);
      console.log("📡 Agora Web Connection State:", curState);
    };

    agoraClient.on("connection-state-change", handleStateChange);
    return () => agoraClient.off("connection-state-change", handleStateChange);
  }, []);

  // --- FIXED: MEDICAL HEARTBEAT (Targeting 'appointments') ---
  useEffect(() => {
    if (!channelName) return;

    // 🛑 PATH SYNC: Changed "sessions" to "appointments" 
    // to match your current Firestore structure.
    const sessionRef = doc(db, "appointments", channelName);
    
    // Pulse every 10 seconds to let the patient app know we are alive
    const heartbeatInterval = setInterval(async () => {
      try {
        await updateDoc(sessionRef, {
          doctorLastActive: serverTimestamp(),
          status: "ongoing"
        });
        console.log(`💓 Heartbeat synced to appointments/${channelName}`);
      } catch (err) {
        // If this still fails, your document ID is likely not in the 'appointments' collection
        console.error("❌ Heartbeat Sync Failed:", err.message);
      }
    }, 10000);

    return () => clearInterval(heartbeatInterval);
  }, [channelName]);
  
  // 6. Select which track to send
  const activeVideoTrack = useMemo(() => {
    if (screenShareOn && screenTrack) return screenTrack;
    return videoOn ? localCameraTrack : null;
  }, [screenShareOn, screenTrack, videoOn, localCameraTrack]);

  // 7. Publish Tracks
  usePublish([localMicrophoneTrack, activeVideoTrack].filter(Boolean));

  // 8. Handle Screen Share errors
  useEffect(() => {
    if (screenError) {
      setScreenShareOn(false);
    }
  }, [screenError]);

  return (
    <div className="video-consultation-container">
      
      {/* --- NEW: RECONNECTING OVERLAY --- */}
      {(connectionStatus === "RECONNECTING" || connectionStatus === "DISCONNECTED") && (
        <div className="web-reconnecting-overlay">
          <div className="web-loader"></div>
          <h3>Network Interrupted</h3>
          <p>Attempting to restore your consultation...</p>
        </div>
      )}

      {/* Remote Section: The Patient */}
      <div className="remote-player-wrapper">
        {remoteUsers.length > 0 ? (
          remoteUsers.map((user) => (
            <div key={user.uid} className="remote-video-frame">
              <RemoteUser user={user} />
              <div className="patient-label">Patient Joined</div>
            </div>
          ))
        ) : (
          <div className="waiting-placeholder">
            <div className="pulse-loader"></div>
            <p>Waiting for Patient to connect...</p>
            <small>Room: {channelName}</small>
          </div>
        )}
      </div>

      {/* Local Section: The Doctor (You) */}
      <div className="local-player-wrapper">
        {activeVideoTrack ? (
          <LocalVideoTrack 
            track={activeVideoTrack} 
            play={true} 
            className="local-video" 
          />
        ) : (
          <div className="cam-off-state">
            <div className="avatar-placeholder">DR</div>
            <p>Camera Off</p>
          </div>
        )}
        <span className="player-label">You (Doctor)</span>
      </div>

      {/* Control Bar */}
      <div className="video-controls">
        <button 
          className={`control-btn ${!micOn ? "off" : ""}`} 
          onClick={() => setMic(!micOn)}
        >
          {micOn ? "🎤 Mic On" : "🔇 Muted"}
        </button>

        <button 
          className={`control-btn ${!videoOn ? "off" : ""}`} 
          onClick={() => setVideo(!videoOn)}
        >
          {videoOn ? "📹 Cam On" : "📷 Cam Off"}
        </button>

        <button 
          className={`control-btn ${screenShareOn ? "active" : ""}`} 
          onClick={() => setScreenShareOn(!screenShareOn)}
        >
          {screenShareOn ? "⏹️ Stop" : "🖥️ Share"}
        </button>

        <button className="control-btn end-call" onClick={onEndCall}>
          🔚 End Session
        </button>
      </div>
    </div>
  );
}

export default function VideoRoom({ appId, token, channelName, uid, onEndCall }) {
  const client = useRTCClient(agoraClient);

  return (
    <AgoraRTCProvider client={client}>
      <VideoCallContent 
        appId={appId} 
        token={token} 
        channelName={channelName} 
        uid={uid} 
        onEndCall={onEndCall} 
      />
    </AgoraRTCProvider>
  );
}