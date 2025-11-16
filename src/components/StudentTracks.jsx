import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { subscribeToSessionStatus, registerFCMToken } from "../services/sessionService";
import { requestNotificationPermission } from "../firebase";
import { isWithinAutoSessionWindow } from "../services/scheduleService";
import { isTodayHoliday } from "../config/holidays";

export default function StudentTracks() {
  const { sessionActive, setSessionActive } = useContext(SessionContext);
  const [sessionData, setSessionData] = useState({ active: false, rideId: null });
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe to real-time session status from Firestore
    const unsubscribe = subscribeToSessionStatus((data) => {
      setSessionData(data);
      setSessionActive(data.active);
      localStorage.setItem("eppo_session", data.active ? "true" : "false");
      if (data.active && data.rideId) {
        localStorage.setItem("eppo_rideId", data.rideId);
      }
    });

    // Request notification permission and register FCM token
    const setupNotifications = async () => {
      const token = await requestNotificationPermission();
      if (token) {
        await registerFCMToken(token, "student");
        console.log("FCM token registered for student");
      }
    };
    setupNotifications();

    return () => unsubscribe();
  }, [setSessionActive]);

  useEffect(() => {
    if (sessionData.active && sessionData.rideId) {
      // Auto-redirect to map when session becomes active
      navigate("/map");
    }
  }, [sessionData, navigate]);

  return (
    <div className="section student-section">
      <div className="glass-surface card">
        <h2 className="card-title">Session Dashboard</h2>
        {!sessionData.active ? (
          <>
            <p className="card-sub">The session is closed at the moment.</p>
            <p className="muted">Driver hasn't started the ride. Check back soon.</p>
            {isTodayHoliday() && (
              <p className="muted" style={{ marginTop: "12px", color: "#9d7ae8" }}>
                🎉 Holiday today - No auto-session
              </p>
            )}
            {!isTodayHoliday() && isWithinAutoSessionWindow() && (
              <p className="muted" style={{ marginTop: "12px", color: "#9d7ae8" }}>
                ⏰ Auto-session active (7:45 AM - 9:00 AM)
              </p>
            )}
            {!isTodayHoliday() && !isWithinAutoSessionWindow() && (
              <p className="muted" style={{ marginTop: "12px" }}>
                📅 Auto-session: Mon-Sat 7:45 AM - 9:00 AM
              </p>
            )}
          </>
        ) : (
          <p className="card-sub">Redirecting to live map...</p>
        )}
        <button 
          className="secondary-btn" 
          onClick={() => navigate("/choose")}
          type="button"
          style={{ marginTop: "18px" }}
        >
          Back to Role Selection
        </button>
      </div>
    </div>
  );
}
