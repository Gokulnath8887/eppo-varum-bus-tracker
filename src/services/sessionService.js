import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// Initialize Firebase Auth
const auth = getAuth();

// Keep track of authentication state
let isAuthenticated = false;

// Set up auth state observer
onAuthStateChanged(auth, (user) => {
  isAuthenticated = !!user;
  console.log("Auth state changed:", isAuthenticated ? "Authenticated" : "Not authenticated");
  if (user) {
    console.log("User UID:", user.uid);
  }
});

// Function to authenticate driver
const authenticateDriver = async () => {
  try {
    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    // Set custom claims for driver role (this would typically be done in a Cloud Function)
    // For now, we'll use a custom token approach
    return userCredential.user;
  } catch (error) {
    console.error("Authentication error:", error);
    throw new Error("Failed to authenticate driver");
  }
};

// Log Firebase configuration status
console.log("Firebase DB initialized:", !!db);

// Start a ride session (driver)
export const startRideSession = async (driverCode, driverId = "driver1") => {
  try {
    console.log("Starting ride session with code:", driverCode);
    
    // Check if Firebase is properly initialized
    if (!db) {
      throw new Error("Firebase not initialized. Check your environment variables.");
    }
    
    // Authenticate the driver
    console.log("Authenticating driver...");
    await authenticateDriver();
    
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Authentication failed. Please try again.");
    }
    
    // Code validation should be done before calling this function
    const rideId = `ride_${Date.now()}`;
    
    console.log("Creating session document with ID:", rideId);
    // Create new session
    await setDoc(doc(db, "sessions", rideId), {
      active: true,
      driverId: user.uid, // Use the authenticated user's UID
      driverCode: driverCode.toUpperCase(), // Store for reference
      startedAt: serverTimestamp(),
      endedAt: null,
      latestLocation: null
    });

    console.log("Updating current session pointer");
    // Update current session pointer
    await setDoc(doc(db, "app", "currentSession"), {
      active: true,
      rideId: rideId,
      updatedAt: serverTimestamp()
    });

    console.log("Session created successfully with rideId:", rideId);
    // TODO: Trigger Cloud Function to send FCM notifications to all students
    // For now, we'll handle this on the client side as a temporary measure

    return { success: true, rideId };
  } catch (error) {
    console.error("Error starting ride session:", error);
    console.error("Error details:", {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Stop the current ride session (driver)
export const stopRideSession = async (rideId) => {
  try {
    // Update session to inactive
    await updateDoc(doc(db, "sessions", rideId), {
      active: false,
      endedAt: serverTimestamp()
    });

    // Update current session pointer
    await updateDoc(doc(db, "app", "currentSession"), {
      active: false,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error("Error stopping ride session:", error);
    throw error;
  }
};

// Publish location update (driver)
export const publishLocation = async (rideId, lat, lng) => {
  try {
    const location = {
      lat,
      lng,
      ts: serverTimestamp()
    };

    // Update latest location in session
    await updateDoc(doc(db, "sessions", rideId), {
      latestLocation: location
    });

    // Optionally store in locations subcollection for history
    await addDoc(collection(db, "sessions", rideId, "locations"), location);

    return { success: true };
  } catch (error) {
    console.error("Error publishing location:", error);
    throw error;
  }
};

// Subscribe to current session status (students)
export const subscribeToSessionStatus = (callback) => {
  const unsubscribe = onSnapshot(
    doc(db, "app", "currentSession"),
    (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      } else {
        callback({ active: false, rideId: null });
      }
    },
    (error) => {
      console.error("Error subscribing to session status:", error);
      callback({ active: false, rideId: null });
    }
  );

  return unsubscribe;
};

// Subscribe to live location updates (students)
export const subscribeToLiveLocation = (rideId, callback) => {
  const unsubscribe = onSnapshot(
    doc(db, "sessions", rideId),
    (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.latestLocation) {
          callback(data.latestLocation);
        }
      }
    },
    (error) => {
      console.error("Error subscribing to location:", error);
    }
  );

  return unsubscribe;
};

// Register FCM token for notifications
export const registerFCMToken = async (token, role = "student") => {
  try {
    await setDoc(doc(db, "fcmTokens", token), {
      token,
      role,
      createdAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error("Error registering FCM token:", error);
    throw error;
  }
};
