import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import logo from "./assets/logo.png"; 
import "./App.css"; 

function App() {
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  // 1. If the doctor is logged in, show the Dashboard
  if (user) {
    return <Dashboard doctor={user} />;
  }

  // 2. If not logged in, show the Futuristic Auth Screen
  return (
    <div className="auth-system-container futuristic-theme">
      {/* 1. BRANDING NAVIGATION */}
      <nav className="global-nav">
        <div className="nav-logo-section">
          <div className="logo-box">
            <img src={logo} alt="TeleHelix Logo" className="header-logo" />
          </div>
          
          <div className="brand-text">
            <h1 className="brand-name-main">
              <span className="color-tele">Tele</span>
              <span className="color-helix">Helix</span>
            </h1>
          </div>
        </div>

        {/* 🚀 Middle Navbar Links (Next-Gen Context) */}
        <div className="nav-middle-links">
          <span className="nav-link-item">Neural Network Providers</span>
          <span className="nav-link-item">Clinical AI Standards</span>
          <span className="nav-link-item">Support Protocol</span>
        </div>
        
        <div className="nav-status">
          <span className="secure-badge pulse-glow">● Quantum-Secure Link</span>
        </div>
      </nav>

      <main className="auth-main-layout">
        {/* 2. LEFT HERO SECTION (Futuristic Value Proposition & Dashboard Preview) */}
        <section className="brand-hero-zone">
           <div className="hero-content">
              <div className="system-status-chip">System Online v3.0</div>
              <h2 className="hero-greeting">The Future of Clinical Practice.</h2>
              <p className="hero-description">
                Access your next-generation medical dashboard. Experience predictive patient routing, real-time biometric syncing, and holographic-ready clinical records.
              </p>

              {/* ⚡ Capability Grid: Previews the "Inside" Dashboard tools */}
              <div className="capability-grid">
                <div className="cap-item">
                  <span className="cap-icon glow-icon">📹</span>
                  <div className="cap-text">
                    <strong>4K Telepresence</strong>
                    <span>Ultra-low latency RTC</span>
                  </div>
                </div>
                <div className="cap-item">
                  <span className="cap-icon glow-icon">🧠</span>
                  <div className="cap-text">
                    <strong>AI-Assisted Triage</strong>
                    <span>Predictive patient queue</span>
                  </div>
                </div>
                <div className="cap-item">
                  <span className="cap-icon glow-icon">🧬</span>
                  <div className="cap-text">
                    <strong>Biometric Sync</strong>
                    <span>Real-time vitals & RX</span>
                  </div>
                </div>
                <div className="cap-item">
                  <span className="cap-icon glow-icon">🛡️</span>
                  <div className="cap-text">
                    <strong>Zero-Trust Vault</strong>
                    <span>AES-256 Quantum Encryption</span>
                  </div>
                </div>
              </div>
           </div>
        </section>

        {/* 3. RIGHT AUTH SECTION (Isolated Card Room) */}
        <section className="auth-content-zone">
          {/* Added an isolated wrapper so the Login/Register cards 
            have a dedicated "room" to stand by themselves, 
            perfect for a glassmorphism or neon-border floating effect.
          */}
          <div className="auth-card-container">
            {showRegister ? (
              <Register
                onRegister={(doctor) => setUser(doctor)}
                switchToLogin={() => setShowRegister(false)}
              />
            ) : (
              <Login
                onLogin={(doctor) => setUser(doctor)}
                switchToRegister={() => setShowRegister(true)}
              />
            )}
          </div>
        </section>
      </main>

      {/* 4. FUTURISTIC FOOTER */}
      <footer className="auth-footer">
        <div className="footer-content">
          <p>
            © 2026 TeleHelix Systems • Global Healthcare Grid •{" "}
            <span className="link">Data Protocols</span>
          </p>
          <div className="encryption-notice">
              🛡️ End-to-End Encrypted Network
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;