import React from "react";

export default function IntroScreen({ onContinue }) {
  return (
    <div className="section intro-section">
      <div className="glass-surface intro-surface">
        <h1 className="hero-title">Eppo Varum</h1>
        <p className="hero-sub">Track your college bus in real-time. No more waiting — know when it arrives.</p>

        <div className="btn-row">
          <button className="neon-black-btn" onClick={() => { localStorage.setItem("eppo_seen_intro","true"); onContinue(); }}>TRACK IT</button>
        </div>
      </div>
    </div>
  );
}
