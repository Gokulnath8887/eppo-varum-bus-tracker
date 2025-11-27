import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SessionContext } from "../App";
import { subscribeToSessionStatus, getSessionStatus } from "../services/sessionService";
import { isTodayHoliday } from "../config/holidays";

// Mock notification permission function
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

// Helper function to check if current time is within auto-session window
const isWithinAutoSessionWindow = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Auto-session window: 7:45 AM - 9:00 AM
  const startHour = 7;
  const startMinute = 45;
  const endHour = 9;
  const endMinute = 0;
  
  const currentTimeInMinutes = hours * 60 + minutes;
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;
  
  return currentTimeInMinutes >= startTimeInMinutes && 
         currentTimeInMinutes <= endTimeInMinutes &&
         now.getDay() !== 0; // Not Sunday
};

export default function StudentTracks() {
  const { sessionActive, setSessionActive } = useContext(SessionContext);
  const [sessionData, setSessionData] = useState({ active: false, rideId: null });
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session status
    const loadSessionStatus = async () => {
      const status = await getSessionStatus();
      if (status) {
        setSessionData({
          active: status.status === 'active',
          rideId: status.id
        });
        setSessionActive(status.status === 'active');
      }
    };
    
    loadSessionStatus();

    // Subscribe to session updates
    const unsubscribe = subscribeToSessionStatus((data) => {
      if (data) {
        setSessionData({
          active: data.status === 'active',
          rideId: data.id
        });
        setSessionActive(data.status === 'active');
      } else {
        setSessionData({ active: false, rideId: null });
        setSessionActive(false);
      }
    });

    // Request notification permission
    requestNotificationPermission().then(granted => {
      if (granted) {
        console.log("Notification permission granted");
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
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
            {isTodayHoliday() ? (
              <p className="muted" style={{ marginTop: "12px", color: "#9d7ae8" }}>
                🎉 Holiday today - No auto-session
              </p>
            ) : isWithinAutoSessionWindow() ? (
              <p className="muted" style={{ marginTop: "12px", color: "#9d7ae8" }}>
                ⏰ Auto-session active (7:45 AM - 9:00 AM)
              </p>
            ) : (
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
