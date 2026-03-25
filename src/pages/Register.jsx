import { useState } from "react";
import { auth } from "../firebaseClient"; // Clean path to your config
import { signInWithCustomToken } from "firebase/auth";
import "./Register.css";

export default function Register({ switchToLogin }) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = "https://telehelix-backend-471218709027.us-central1.run.app";

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

  function validateStep1() {
    const e = {};
    if (form.fullName.trim().length < 3) e.fullName = "Full name must be at least 3 characters";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email format";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e = {};
    if (form.username.trim().length < 3) e.username = "Username must be at least 3 characters";
    if (form.specialization.trim().length < 3) e.specialization = "Specialization is required";
    if (form.bio.trim().length < 20) e.bio = "Bio must be at least 20 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep3() {
    const e = {};
    if (!form.licenseNumber.trim()) e.licenseNumber = "License number is required";
    if (!form.experienceYears || Number(form.experienceYears) <= 0) e.experienceYears = "Enter valid experience";
    if (!form.country.trim()) e.country = "Country is required";
    if (!form.consultationFee || Number(form.consultationFee) <= 0) e.consultationFee = "Enter valid fee";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/doctors/auth/doctor/register`, {
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
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || data.message || "Registration failed");
        setLoading(false);
        return;
      }

      // --- NEW: Sign in to Firebase using the Custom Token from the backend ---
      if (data.token) {
        await signInWithCustomToken(auth, data.token);
        localStorage.setItem("doctorUid", data.uid);
        
        alert("Account created and signed in successfully!");
        // Redirect to dashboard
        window.location.href = "/dashboard"; 
      } else {
        alert("Account created successfully. Please login.");
        switchToLogin();
      }
    } catch (err) {
      console.error("Connection Error:", err);
      setError("Network error. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Doctor Registration</h1>
        <p className="step-text">Step {step} of 4</p>

        {error && <p className="error-text center">{error}</p>}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <input type="text" name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} />
            {errors.fullName && <p className="error-text">{errors.fullName}</p>}

            <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} />
            {errors.email && <p className="error-text">{errors.email}</p>}

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}

            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}

            <div className="toggle-row">
              <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
              <span>Show password</span>
            </div>

            <button onClick={() => validateStep1() && setStep(2)}>Next</button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <input type="text" name="username" placeholder="Username (e.g. drjohn)" value={form.username} onChange={handleChange} />
            {errors.username && <p className="error-text">{errors.username}</p>}

            <input type="text" name="specialization" placeholder="Specialization (e.g. Cardiologist)" value={form.specialization} onChange={handleChange} />
            {errors.specialization && <p className="error-text">{errors.specialization}</p>}

            <textarea name="bio" placeholder="Short professional bio" value={form.bio} onChange={handleChange}></textarea>
            {errors.bio && <p className="error-text">{errors.bio}</p>}

            <div className="btn-row">
              <button className="secondary" onClick={() => setStep(1)}>Back</button>
              <button onClick={() => validateStep2() && setStep(3)}>Next</button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <input type="text" name="licenseNumber" placeholder="License Number" value={form.licenseNumber} onChange={handleChange} />
            {errors.licenseNumber && <p className="error-text">{errors.licenseNumber}</p>}

            <input type="number" name="experienceYears" placeholder="Years of Experience" value={form.experienceYears} onChange={handleChange} />
            {errors.experienceYears && <p className="error-text">{errors.experienceYears}</p>}

            <input type="text" name="country" placeholder="Country" value={form.country} onChange={handleChange} />
            {errors.country && <p className="error-text">{errors.country}</p>}

            <input type="number" name="consultationFee" placeholder="Consultation Fee" value={form.consultationFee} onChange={handleChange} />
            {errors.consultationFee && <p className="error-text">{errors.consultationFee}</p>}

            <div className="btn-row">
              <button className="secondary" onClick={() => setStep(2)}>Back</button>
              <button onClick={() => validateStep3() && setStep(4)}>Preview</button>
            </div>
          </>
        )}

        {/* STEP 4 - PREVIEW */}
        {step === 4 && (
          <>
            <div className="preview-box">
              <h3>Confirm Your Details</h3>
              <div className="preview-row"><span>Full Name:</span><strong>{form.fullName}</strong></div>
              <div className="preview-row"><span>Email:</span><strong>{form.email}</strong></div>
              <div className="preview-row"><span>Username:</span><strong>{form.username}</strong></div>
              <div className="preview-row"><span>Specialization:</span><strong>{form.specialization}</strong></div>
              <div className="preview-row"><span>Bio:</span><strong>{form.bio}</strong></div>
              <div className="preview-row"><span>License:</span><strong>{form.licenseNumber}</strong></div>
              <div className="preview-row"><span>Experience:</span><strong>{form.experienceYears} years</strong></div>
              <div className="preview-row"><span>Country:</span><strong>{form.country}</strong></div>
              <div className="preview-row"><span>Fee:</span><strong>{form.consultationFee}</strong></div>
            </div>

            <div className="btn-row">
              <button className="secondary" onClick={() => setStep(3)}>Back</button>
              <button onClick={handleSubmit} disabled={loading}>
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </>
        )}

        <p className="switch-text">
          Already have an account?{" "}
          <span className="switch-link" onClick={switchToLogin}>
            Login
          </span>
        </p>
      </div>
    </div>
  );
}