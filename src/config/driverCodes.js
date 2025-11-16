// Driver access codes configuration
// In production, these should be stored in Firestore with hashed values
// For now, we'll use a simple local validation

export const VALID_DRIVER_CODES = [
  "BUS77A",
  "GOKU",
  "GOKULNATH8887",
  "AUTO_SESSION_7AM" // Used by automatic scheduler
];

// Validate driver code
export const validateDriverCode = (code) => {
  return VALID_DRIVER_CODES.includes(code.trim().toUpperCase());
};

// In production, replace this with Firebase validation:
// - Store hashed codes in Firestore drivers collection
// - Validate via Cloud Function
// - Return session token on success
