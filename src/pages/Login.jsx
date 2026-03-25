import { useState } from "react";
import "./Login.css";
// 🔹 import Firebase auth client
import { auth } from "../firebaseClient"; 
import { signInWithCustomToken } from "firebase/auth";

export default function Login({ onLogin, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = "https://telehelix-backend-471218709027.us-central1.run.app";

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in both fields");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. Call your backend to verify user and get a Custom Token
      const response = await fetch(`${BACKEND_URL}/api/doctors/auth/doctor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed. Check credentials.");
        setLoading(false);
        return;
      }

      // 2. EXCHANGE Custom Token for a real ID Token using Firebase Client
      if (data.token) {
        // Sign in to Firebase on the frontend using the token from the backend
        const userCredential = await signInWithCustomToken(auth, data.token);
        
        // --- NEW: CAPTURE THE UID FOR THE QUEUE ---
        const uid = userCredential.user.uid;
        localStorage.setItem("doctorUid", uid);
        // ------------------------------------------

        // Get the real ID Token (this is what the backend middleware expects)
        const idToken = await userCredential.user.getIdToken();
        
        // 3. STORE AS "authToken" TO MATCH DASHBOARD.JS
        localStorage.setItem("authToken", idToken);
        
        // Pass the updated data object (with ID token and UID) to the parent component
        onLogin({ ...data, token: idToken, uid: uid });
      } else {
        throw new Error("No token received from server");
      }

    } catch (err) {
      console.error("Login Error:", err);
      setError(err.message || "Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>TeleHelix Login</h1>
        <p>Enter your email and password</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="error-text">{error}</p>}

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="switch-text">
          New here?{" "}
          <span className="switch-link" onClick={switchToRegister}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
}