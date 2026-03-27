import { useState } from "react";
import { auth } from "../firebaseClient";
import { signInWithCustomToken } from "firebase/auth";
import "./Register.css";

export default function Register({ switchToLogin }) {
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);

  const BACKEND_URL =
    "https://telehelix-backend-471218709027.us-central1.run.app";

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    specialization: "",
    bio: "",
    licenseNumber: "",
    experienceYears: "",
    country: "",
    consultationFee: "",
  });

  const [errors, setErrors] = useState({});

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ---- VALIDATION (UNCHANGED) ----
  function validateStep2() {
    const e = {};
    if (form.fullName.trim().length < 3)
      e.fullName = "Full name must be at least 3 characters";
    if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = "Invalid email format";
    if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e = {};
    if (form.username.trim().length < 3)
      e.username = "Username must be at least 3 characters";
    if (form.specialization.trim().length < 3)
      e.specialization = "Specialization is required";
    if (form.bio.trim().length < 20)
      e.bio = "Bio must be at least 20 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep4() {
    const e = {};
    if (!form.licenseNumber.trim())
      e.licenseNumber = "License number is required";
    if (!form.experienceYears || Number(form.experienceYears) <= 0)
      e.experienceYears = "Enter valid experience";
    if (!form.country.trim()) e.country = "Country is required";
    if (!form.consultationFee || Number(form.consultationFee) <= 0)
      e.consultationFee = "Enter valid fee";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/doctors/auth/doctor/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            username: form.username,
            specialization: form.specialization,
            bio: form.bio,
            licenseNumber: form.licenseNumber,
            experienceYears: Number(form.experienceYears),
            country: form.country,
            consultationFee: Number(form.consultationFee),
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || data.message || "Registration failed");
        return;
      }

      if (data.token) {
        await signInWithCustomToken(auth, data.token);
        localStorage.setItem("doctorUid", data.uid);
        window.location.href = "/dashboard";
      } else {
        switchToLogin();
      }
    } catch (err) {
      setError("Network error. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <div className="register-card">
        {/* TERMS MODAL */}
        {showTermsModal && (
          <div className="terms-overlay">
            <div className="terms-modal-card">
              <h2>Professional Terms</h2>
              <div className="terms-content">
                <p>
                  Providers must maintain valid licensing. Missed appointments
                  are refundable to patients. All data is securely encrypted.
                </p>
              </div>
              <button
                className="primary-btn"
                onClick={() => setShowTermsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* HEADER */}
        <header className="card-header">
          <h1>Provider Registration</h1>
          <p>Step {step} of 5</p>
        </header>

        {error && <div className="error-box">{error}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="terms-step">
            <ul className="terms-list">
              <li>✔ License verification required</li>
              <li>✔ Missed appointments are refundable</li>
              <li>✔ Secure storage of provider data</li>
            </ul>

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={agreed}
                onChange={() => setAgreed(!agreed)}
              />
              <span>
                I agree to the professional terms{" "}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setShowTermsModal(true)}
                >
                  View terms
                </button>
              </span>
            </label>

            <button
              className="primary-btn"
              onClick={() => agreed && setStep(2)}
              disabled={!agreed}
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="form-group">
            <h3>Account Credentials</h3>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Medical Email"
              value={form.email}
              onChange={handleChange}
            />

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
            />

            <button
              className="primary-btn"
              onClick={() => validateStep2() && setStep(3)}
            >
              Next
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="form-group">
            <h3>Professional Profile</h3>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
            />
            <input
              type="text"
              name="specialization"
              placeholder="Specialization"
              value={form.specialization}
              onChange={handleChange}
            />
            <textarea
              name="bio"
              placeholder="Professional Bio"
              value={form.bio}
              onChange={handleChange}
            />

            <div className="btn-row">
              <button className="secondary-btn" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                className="primary-btn"
                onClick={() => validateStep3() && setStep(4)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="form-group">
            <h3>Licensing & Practice</h3>
            <input
              type="text"
              name="licenseNumber"
              placeholder="License Number"
              value={form.licenseNumber}
              onChange={handleChange}
            />
            <input
              type="number"
              name="experienceYears"
              placeholder="Years of Experience"
              value={form.experienceYears}
              onChange={handleChange}
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
            />
            <input
              type="number"
              name="consultationFee"
              placeholder="Consultation Fee"
              value={form.consultationFee}
              onChange={handleChange}
            />

            <div className="btn-row">
              <button className="secondary-btn" onClick={() => setStep(3)}>
                Back
              </button>
              <button
                className="primary-btn"
                onClick={() => validateStep4() && setStep(5)}
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <div className="preview-container">
            <p><strong>Name:</strong> {form.fullName}</p>
            <p><strong>Email:</strong> {form.email}</p>
            <p><strong>License:</strong> {form.licenseNumber}</p>

            <div className="btn-row">
              <button className="secondary-btn" onClick={() => setStep(4)}>
                Back
              </button>
              <button
                className="primary-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Registration"}
              </button>
            </div>
          </div>
        )}

        <p className="switch-text">
          Already registered?{" "}
          <span className="link" onClick={switchToLogin}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}