import { useState } from "react";
import "./Login.css";
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
      if (data.token) {
        const userCredential = await signInWithCustomToken(auth, data.token);
        const uid = userCredential.user.uid;
        localStorage.setItem("doctorUid", uid);
        const idToken = await userCredential.user.getIdToken();
        localStorage.setItem("authToken", idToken);
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
    <div className="login-card">
      <div className="card-header">
        <h1>Doctor Portal</h1>
        <p>Access your clinical workspace</p>
      </div>

      <div className="input-group">
        <label>Medical Email</label>
        <input
          type="email"
          placeholder="e.g. doctor@telehelix.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="input-group">
        <div className="label-row">
          <label>Password</label>
          <span className="forgot-link">Forgot Password?</span>
        </div>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <div className="error-box">{error}</div>}

      <button className="login-btn" onClick={handleLogin} disabled={loading}>
        {loading ? <span className="loader"></span> : "Sign In to Dashboard"}
      </button>

      <div className="divider">
        <span>OR</span>
      </div>

      <p className="switch-text">
        New to TeleHelix?{" "}
        <span className="register-highlight" onClick={switchToRegister}>
          Create Provider Account
        </span>
      </p>
    </div>
  );
}