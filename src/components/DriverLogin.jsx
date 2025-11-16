import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { startRideSession, stopRideSession } from "../services/sessionService";
import { validateDriverCode } from "../config/driverCodes";

export default function DriverLogin() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [rideId, setRideId] = useState(() => localStorage.getItem("eppo_rideId") || null);
  const { setSessionActive } = useContext(SessionContext);
  const navigate = useNavigate();

  const startRide = async () => {
    if (code.trim().length === 0) {
      alert("Enter driver code");
      return;
    }
    
    // Validate driver code
    console.log("Validating code:", code);
    const isValid = validateDriverCode(code);
    console.log("Is valid:", isValid);
    
    if (!isValid) {
      alert("Invalid driver code. Please check your access code and try again.\n\nValid codes: BUS77A, GOKU, GOKULNATH8887");
      return;
    }
    
    console.log("Starting ride with code:", code);
    setLoading(true);
    try {
      console.log("Calling startRideSession...");
      const result = await startRideSession(code);
      console.log("startRideSession result:", result);
      
      if (result.success) {
        console.log("Ride started successfully, navigating to map");
        setSessionActive(true);
        setRideId(result.rideId);
        localStorage.setItem("eppo_session", "true");
        localStorage.setItem("eppo_rideId", result.rideId);
        navigate("/map");
      } else {
        alert("Failed to start ride: No success response");
      }
    } catch (error) {
      console.error("Error starting ride:", error);
      alert("Failed to start ride: " + error.message + "\n\nCheck console for details.");
    } finally {
      setLoading(false);
    }
  };

  const stopRide = async () => {
    if (!rideId) {
      navigate("/choose");
      return;
    }
    
    setLoading(true);
    try {
      await stopRideSession(rideId);
      setSessionActive(false);
      localStorage.setItem("eppo_session", "false");
      localStorage.removeItem("eppo_rideId");
      setRideId(null);
      navigate("/choose");
    } catch (error) {
      alert("Failed to stop ride: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section driver-section">
      <div className="glass-surface card">
        <h2 className="card-title">Driver Access</h2>
        <p className="card-sub">Enter secure access code to start sharing location for this session.</p>

        <input 
          className="input-field" 
          placeholder="Access code" 
          value={code} 
          onChange={(e) => setCode(e.target.value)}
          disabled={loading}
        />

        <button 
          className="neon-black-btn" 
          onClick={startRide}
          disabled={loading}
        >
          {loading ? "Starting..." : "Start Ride"}
        </button>
        <button 
          className="secondary-btn" 
          onClick={stopRide}
          disabled={loading}
        >
          {loading ? "Stopping..." : "Stop Ride"}
        </button>
      </div>
    </div>
  );
}
