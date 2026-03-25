import React, { useState } from 'react';

const Profile = () => {
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");

  return (
    <div className="profile-container animate-fade-in">
      <div className="pro-editor-shell">
        
        {/* Header Section */}
        <div className="editor-header">
          <div className="text-meta">
            <h2>Clinical Credentials</h2>
            <p>Refine your professional identity for the TeleHelix network.</p>
          </div>
          <div className="editor-actions">
            <button className="btn-secondary-dark">Discard</button>
            <button className="btn-primary-glow">Publish Profile</button>
          </div>
        </div>

        <div className="editor-content">
          {/* Specialty Field - Clean & Modern */}
          <div className="floating-group">
            <label>Primary Medical Designation</label>
            <input 
              type="text" 
              className="minimal-input"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g. Consultant Neurosurgeon" 
            />
          </div>

          {/* Bio Field - Focused Writing Space */}
          <div className="floating-group">
            <label>Professional Narrative</label>
            <div className="textarea-wrapper">
              <textarea 
                className="minimal-textarea"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Compose your professional background, clinical interests, and philosophy of care..."
              ></textarea>
              <div className="textarea-footer">
                <span className="word-count">{bio.length} / 1000 characters</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;