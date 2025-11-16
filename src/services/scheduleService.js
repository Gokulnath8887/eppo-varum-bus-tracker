import { startRideSession } from "./sessionService";
import { isTodayHoliday } from "../config/holidays";

// Auto-session configuration
const AUTO_SESSION_CONFIG = {
  startTime: { hour: 7, minute: 45 }, // 7:45 AM
  endTime: { hour: 9, minute: 0 },    // 9:00 AM
  autoDriverCode: "AUTO_SESSION_7AM", // Code used for auto sessions
  enabled: true
};

// Check if current time is within auto-session window
export const isWithinAutoSessionWindow = () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Don't run on Sundays
  if (dayOfWeek === 0) {
    return false;
  }
  
  // Don't run on holidays
  if (isTodayHoliday()) {
    console.log("Auto-session skipped: Today is a holiday");
    return false;
  }
  
  const startMinutes = AUTO_SESSION_CONFIG.startTime.hour * 60 + AUTO_SESSION_CONFIG.startTime.minute;
  const endMinutes = AUTO_SESSION_CONFIG.endTime.hour * 60 + AUTO_SESSION_CONFIG.endTime.minute;
  const currentMinutes = currentHour * 60 + currentMinute;
  
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

// Start auto session if within time window and no active session
export const checkAndStartAutoSession = async (currentSessionActive) => {
  if (!AUTO_SESSION_CONFIG.enabled) {
    return { autoStarted: false, reason: "Auto-session disabled" };
  }

  if (currentSessionActive) {
    return { autoStarted: false, reason: "Session already active" };
  }

  if (!isWithinAutoSessionWindow()) {
    return { autoStarted: false, reason: "Outside auto-session time window" };
  }

  // Check if auto session was already started today
  const lastAutoSessionDate = localStorage.getItem("eppo_last_auto_session");
  const today = new Date().toDateString();
  
  if (lastAutoSessionDate === today) {
    return { autoStarted: false, reason: "Auto-session already started today" };
  }

  try {
    console.log("Auto-starting session for 7:45 AM - 9:00 AM window");
    const result = await startRideSession(AUTO_SESSION_CONFIG.autoDriverCode, "auto_driver");
    
    if (result.success) {
      localStorage.setItem("eppo_last_auto_session", today);
      return { 
        autoStarted: true, 
        rideId: result.rideId,
        message: "Auto-session started (7:45 AM - 9:00 AM)" 
      };
    }
  } catch (error) {
    console.error("Failed to auto-start session:", error);
    return { autoStarted: false, reason: error.message };
  }

  return { autoStarted: false, reason: "Unknown error" };
};

// Get minutes until auto-session starts
export const getMinutesUntilAutoSession = () => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = AUTO_SESSION_CONFIG.startTime.hour * 60 + AUTO_SESSION_CONFIG.startTime.minute;
  
  if (currentMinutes >= startMinutes) {
    // Already past start time, check tomorrow
    return (24 * 60 - currentMinutes) + startMinutes;
  }
  
  return startMinutes - currentMinutes;
};

// Schedule auto-session check (runs every minute)
export const startAutoSessionScheduler = (onSessionStart) => {
  const checkInterval = setInterval(async () => {
    const currentSessionActive = localStorage.getItem("eppo_session") === "true";
    const result = await checkAndStartAutoSession(currentSessionActive);
    
    if (result.autoStarted && onSessionStart) {
      onSessionStart(result);
    }
  }, 60000); // Check every 1 minute

  // Initial check on startup
  const performInitialCheck = async () => {
    const currentSessionActive = localStorage.getItem("eppo_session") === "true";
    const result = await checkAndStartAutoSession(currentSessionActive);
    
    if (result.autoStarted && onSessionStart) {
      onSessionStart(result);
    }
  };
  
  performInitialCheck();

  return () => clearInterval(checkInterval);
};

export { AUTO_SESSION_CONFIG };
