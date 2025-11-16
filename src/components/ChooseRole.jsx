import React from "react";
import { useNavigate } from "react-router-dom";

export default function ChooseRole() {
  const navigate = useNavigate();

  return (
    <div className="section choose-section">
      <div className="glass-surface card">
        <h2 className="card-title">Choose Your Role</h2>
        <p className="card-sub">Select whether you're a driver or a student.</p>
        
        <div className="center-card">
          <button 
            className="neon-black-btn" 
            onClick={() => navigate("/driver")}
            type="button"
          >
            Driver
          </button>
          <button 
            className="neon-black-btn" 
            onClick={() => navigate("/student")}
            type="button"
          >
            Student
          </button>
          <button 
            className="secondary-btn" 
            onClick={() => { 
              localStorage.removeItem("eppo_seen_intro"); 
              navigate("/"); 
            }}
            type="button"
          >
            Reset Intro
          </button>
        </div>
      </div>
    </div>
  );
}

