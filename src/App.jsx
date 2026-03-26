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

  // 2. If not logged in, show the Live & Casual Auth Screen
  return (
    <div className="auth-system-container">
      {/* 1. BRANDING NAVIGATION (Logo position is untouched) */}
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

        {/* 🚀 Middle Navbar Links (Professional Context) */}
        <div className="nav-middle-links">
          <span className="nav-link-item">Provider Network</span>
          <span className="nav-link-item">Clinical Standards</span>
          <span className="nav-link-item">Help Center</span>
        </div>
        
        <div className="nav-status">
          <span className="secure-badge">● System Live & Secure</span>
        </div>
      </nav>

      <main className="auth-main-layout">
        {/* 2. LEFT HERO SECTION (Value Proposition & Branding) */}
        <section className="brand-hero-zone">
           <div className="hero-content">
              <h2 className="hero-greeting">Medicine in Harmony.</h2>
              <p className="hero-description">
                Experience a clinical workspace that feels like a breath of fresh air. 
                Simple, peaceful, and professional.
              </p>

              {/* ⚡ Capability Grid: Previews the "Inside" tools */}
              <div className="capability-grid">
                <div className="cap-item">
                  <span className="cap-icon">📹</span>
                  <div className="cap-text">
                    <strong>HD Consultation</strong>
                    <span>Ultra-low latency RTC</span>
                  </div>
                </div>
                <div className="cap-item">
                  <span className="cap-icon">⏳</span>
                  <div className="cap-text">
                    <strong>Smart Queue</strong>
                    <span>Automated patient triage</span>
                  </div>
                </div>
                <div className="cap-item">
                  <span className="cap-icon">🩺</span>
                  <div className="cap-text">
                    <strong>Clinical Tools</strong>
                    <span>Digital RX & Records</span>
                  </div>
                </div>
                <div className="cap-item">
                  <span className="cap-icon">🛡️</span>
                  <div className="cap-text">
                    <strong>Secure Vault</strong>
                    <span>AES-256 Data Encryption</span>
                  </div>
                </div>
              </div>
           </div>
        </section>

        {/* 3. RIGHT AUTH SECTION (Direct Injection of Cards) */}
        <section className="auth-content-zone">
          {/* CLEANSED: We removed the extra headers and wrappers. 
              The Login and Register components now sit directly in the viewport
              as the primary focus cards.
          */}
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
        </section>
      </main>

      {/* 4. CASUAL FOOTER */}
      <footer className="auth-footer">
        <div className="footer-content">
          <p>
            © 2026 TeleHelix Telemedicine • HIPAA Compliant •{" "}
            <span className="link">Privacy & Legal</span>
          </p>
          <div className="encryption-notice">
              🔒 Encrypted End-to-End
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;