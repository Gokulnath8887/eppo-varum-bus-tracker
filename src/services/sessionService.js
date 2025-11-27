// Simple in-memory session management
let activeSession = null;
let sessionListeners = [];
let locationListeners = [];

// Start a ride session (driver)
export const startRideSession = async (driverCode, driverId = "driver1") => {
  console.log("Starting ride session with code:", driverCode);
  
  // Simple validation
  if (!driverCode) {
    throw new Error("Driver code is required");
  }

  const sessionData = {
    id: `session_${Date.now()}`,
    driverId,
    driverCode,
    startTime: new Date().toISOString(),
    status: "active",
    lastUpdated: new Date().toISOString(),
    latestLocation: null
  };

  // Store session in memory
  activeSession = sessionData;
  
  // Notify listeners
  sessionListeners.forEach(listener => listener(activeSession));
  
  return { 
    success: true, 
    ...activeSession
  };
};

// Stop the current ride session
export const stopRideSession = async () => {
  if (!activeSession) return { success: false, error: "No active session" };
  
  const sessionData = {
    ...activeSession,
    status: "completed",
    endTime: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  };
  
  activeSession = null;
  
  // Notify listeners
  sessionListeners.forEach(listener => listener(null));
  
  return { success: true };
};

// Get current session status
export const getSessionStatus = async () => {
  return activeSession ? { ...activeSession } : null;
};

// Publish location update (driver)
export const publishLocation = async (rideId, lat, lng) => {
  if (!activeSession || activeSession.id !== rideId) {
    throw new Error("No active session found for this ride");
  }

  const location = {
    lat,
    lng,
    timestamp: new Date().toISOString()
  };

  // Update latest location
  activeSession = {
    ...activeSession,
    latestLocation: location,
    lastUpdated: new Date().toISOString()
  };

  // Notify location listeners
  locationListeners.forEach(listener => listener(location));
  
  return { success: true };
};

// Subscribe to session updates
export const subscribeToSessionStatus = (callback) => {
  // Initial callback with current status
  if (activeSession) {
    callback({ ...activeSession });
  } else {
    callback({ active: false, rideId: null });
  }
  
  // Add to listeners
  sessionListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    sessionListeners = sessionListeners.filter(cb => cb !== callback);
  };
};

// Subscribe to live location updates (students)
export const subscribeToLiveLocation = (rideId, callback) => {
  // Initial callback if location exists
  if (activeSession && activeSession.id === rideId && activeSession.latestLocation) {
    callback(activeSession.latestLocation);
  }
  
  // Add to listeners
  const listener = (location) => {
    if (activeSession && activeSession.id === rideId) {
      callback(location);
    }
  };
  
  locationListeners.push(listener);
  
  // Return unsubscribe function
  return () => {
    locationListeners = locationListeners.filter(cb => cb !== listener);
  };
};

// Stub for FCM token registration (for compatibility)
export const registerFCMToken = async (token, role = "student") => {
  console.log("FCM registration not available (Firebase removed)");
  return { success: false, message: "Push notifications not available" };
};

// Initialize auth (stub for compatibility)
export const initAuth = async () => {
  return { uid: 'local-user' };
};
