import React, { useState } from "react";
import "./ScheduleManager.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function ScheduleManager({ backendUrl }) {
  const [schedule, setSchedule] = useState({
    Monday: { active: true, start: "09:00", end: "17:00" },
    Tuesday: { active: true, start: "09:00", end: "17:00" },
    Wednesday: { active: true, start: "09:00", end: "17:00" },
    Thursday: { active: true, start: "09:00", end: "17:00" },
    Friday: { active: true, start: "09:00", end: "17:00" },
    Saturday: { active: false, start: "10:00", end: "14:00" },
    Sunday: { active: false, start: "10:00", end: "14:00" },
  });

  const [saving, setSaving] = useState(false);

  const handleToggle = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], active: !prev[day].active },
    }));
  };

  const handleTimeChange = (day, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const saveSchedule = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("authToken");

      // --- THE SYNC FIX (FLATTENED) ---
      // We send the days directly. Your backend 'setAvailability' 
      // is already responsible for wrapping this into the Firestore 'slots' map.
      const formattedSchedule = {};
      Object.keys(schedule).forEach((day) => {
        formattedSchedule[day] = {
          active: schedule[day].active,
          start: schedule[day].start,
          end: schedule[day].end,
        };
      });

      const res = await fetch(`${backendUrl}/api/doctors/profile/availability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ weeklySchedule: formattedSchedule }),
      });

      if (!res.ok) throw new Error("Failed to save schedule");
      
      alert("Weekly availability synchronized! Your schedule is now clean in the database.");
    } catch (err) {
      console.error("Save Error:", err);
      alert("Error saving schedule. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="schedule-manager-container">
      <div className="schedule-card glass-morph">
        <h2>Weekly Consultation Hours</h2>
        <p className="subtitle">Set your active days. Slots are automatically generated for patients in 30-minute intervals.</p>
        
        <div className="days-list">
          {DAYS.map((day) => (
            <div key={day} className={`day-row ${schedule[day].active ? "active" : "inactive"}`}>
              <div className="day-info">
                <label className="switch">
                  <input 
                    type="checkbox" 
                    checked={schedule[day].active} 
                    onChange={() => handleToggle(day)} 
                  />
                  <span className="slider round"></span>
                </label>
                <span className="day-name">{day}</span>
              </div>

              {schedule[day].active && (
                <div className="time-pickers">
                  <input 
                    type="time" 
                    value={schedule[day].start} 
                    onChange={(e) => handleTimeChange(day, "start", e.target.value)} 
                  />
                  <span>to</span>
                  <input 
                    type="time" 
                    value={schedule[day].end} 
                    onChange={(e) => handleTimeChange(day, "end", e.target.value)} 
                  />
                </div>
              )}
              {!schedule[day].active && <span className="off-text">Unavailable</span>}
            </div>
          ))}
        </div>

        <button 
          className="save-schedule-btn" 
          onClick={saveSchedule} 
          disabled={saving}
        >
          {saving ? "Updating Cloud..." : "Save Weekly Template"}
        </button>
      </div>
    </div>
  );
}