import React from "react";
import { Link } from "react-router-dom";

export default function NavDrawer({ open, onClose }) {
  return (
    <div className={`nav-drawer ${open ? "open" : ""}`} role="dialog" aria-hidden={!open}>
      <div className="drawer-inner">
        <button className="close-btn" onClick={onClose}>✕</button>
        <nav className="drawer-nav">
          <Link to="/" onClick={onClose}>Home</Link>
          <Link to="/student" onClick={onClose}>Student</Link>
          <Link to="/driver" onClick={onClose}>Driver</Link>
        </nav>
      </div>
      <div className="drawer-backdrop" onClick={onClose}/>
    </div>
  );
}
