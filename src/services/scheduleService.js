import { startRideSession } from "./sessionService";
import { isTodayHoliday } from "../config/holidays";

// Auto-session configuration
export const AUTO_SESSION_CONFIG = {
  enabled: false, // Auto-session is disabled by default without Firebase
  startTime: "08:00", // 24-hour format
  endTime: "18:00",  // 24-hour format
  checkInterval: 5 * 60 * 1000, // 5 minutes
  driverCode: "AUTO123" // Special code for auto-sessions
};

// Track if we've already started a session today
let hasAutoSessionStarted = false;

// Check if current time is within the auto-session window
const isWithinAutoSessionWindow = () => {
  if (!AUTO_SESSION_CONFIG.enabled) return false;
  
  const now = new Date();
  const [startHour, startMinute] = AUTO_SESSION_CONFIG.startTime.split(':').map(Number);
  const [endHour, endMinute] = AUTO_SESSION_CONFIG.endTime.split(':').map(Number);
  
  const startTime = new Date();
  startTime.setHours(startHour, startMinute, 0, 0);
  
  const endTime = new Date();
  endTime.setHours(endHour, endMinute, 0, 0);
  
  return now >= startTime && now <= endTime;
};

// Start auto session if within time window and no active session
export const checkAndStartAutoSession = async (currentSessionActive) => {
  if (!AUTO_SESSION_CONFIG.enabled) {
    return { autoStarted: false, reason: "Auto-session is disabled" };
  }

  if (currentSessionActive) {
    return { autoStarted: false, reason: "Session already active" };
  }

  if (hasAutoSessionStarted) {
    return { autoStarted: false, reason: "Auto-session already started today" };
  }

  if (isTodayHoliday()) {
    return { autoStarted: false, reason: "Today is a holiday" };
  }

  if (!isWithinAutoSessionWindow()) {
    return { autoStarted: false, reason: "Outside of auto-session hours" };
  }

  try {
    console.log("Starting auto-session...");
    await startRideSession(AUTO_SESSION_CONFIG.driverCode, "auto-driver");
    hasAutoSessionStarted = true;
    return { autoStarted: true };
  } catch (error) {
    console.error("Failed to start auto-session:", error);
    return { autoStarted: false, reason: error.message };
  }
};

// Reset auto-session flag at midnight
const resetAutoSessionFlag = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  
  const timeUntilMidnight = midnight - now;
  
  setTimeout(() => {
    hasAutoSessionStarted = false;
    console.log("Auto-session flag reset for a new day");
    resetAutoSessionFlag(); // Schedule next reset
  }, timeUntilMidnight);
};

// Initialize the auto-session system
export const initAutoSessionSystem = () => {
  if (!AUTO_SESSION_CONFIG.enabled) {
    console.log("Auto-session system is disabled");
    return;
  }
  
  // Start the auto-reset cycle
  resetAutoSessionFlag();
  
  console.log("Auto-session system initialized");
};

// Schedule auto-session check (runs every minute)
export const startAutoSessionScheduler = (onSessionStart) => {
  if (!AUTO_SESSION_CONFIG.enabled) {
    return () => {}; // Return empty cleanup function
  }

  const checkInterval = setInterval(async () => {
    const result = await checkAndStartAutoSession(false);
    if (result.autoStarted && onSessionStart) {
      onSessionStart(result);
    }
  }, 60000); // Check every 1 minute

  // Initial check
  checkAndStartAutoSession(false).then(result => {
    if (result.autoStarted && onSessionStart) {
      onSessionStart(result);
    }
  });

  // Return cleanup function
  return () => clearInterval(checkInterval);
};
