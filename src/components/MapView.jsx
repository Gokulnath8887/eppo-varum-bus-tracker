import React, { useContext, useEffect, useState, useRef } from "react";
import { SessionContext } from "../App";
import { subscribeToLiveLocation, publishLocation, stopRideSession } from "../services/sessionService";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Set default icon for all markers
L.Marker.prototype.options.icon = defaultIcon;

// Custom component to update map center and zoom when position changes
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, map, zoom]);
  return null;
}

export default function MapView() {
  const { sessionActive, setSessionActive } = useContext(SessionContext);
  const [position, setPosition] = useState({ lat: 11.6643, lng: 78.1460 }); // Default to Salem
  const [rideId, setRideId] = useState(() => localStorage.getItem("eppo_rideId"));
  const [isDriver, setIsDriver] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const locationHistory = useRef([]);
  const MAX_HISTORY = 5;
  const movementThreshold = 5; // meters

    // Custom bus icon with rotation based on movement
  const BusMarker = ({ position, isMoving }) => {
    const markerRef = useRef();
    const prevPosition = useRef(position);
    const [rotation, setRotation] = useState(0);
    
    // Update rotation when position changes
    useEffect(() => {
      if (position && prevPosition.current) {
        const dx = position.lng - prevPosition.current.lng;
        const dy = position.lat - prevPosition.current.lat;
        if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
          // Calculate bearing in degrees
          const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
          setRotation(angle);
        }
      }
      prevPosition.current = position;
    }, [position]);

    return (
      <Marker 
        position={position}
        icon={new L.Icon({
          iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSIjZmY1YjFjIiBkPSJNNDQ4IDM4NGMwIDI2LjUtMjEuNSA0OC00OCA0OGgtMTZjLTE3LjcgMC0zMi0xNC4zLTMyLTMydi0xNmgtOTZ2MTZjMCAxNy43LTE0LjMgMzItMzIgMzJoLTE2Yy0xNy43IDAtMzItMTQuMy0zMi0zMnYtMTZoLTk2djE2YzAgMTcuNy0xNC4zIDMyLTMyIDMySDQ4Yy0yNi41IDAtNDgtMjEuNS00OC00OFYxNjBjMC0zNS4zIDI4LjctNjQgNjQtNjRoMjU2YzM1LjMgMCA2NCAyOC43IDY0IDY0djIyNHptLTMyMC05NmMwLTE3LjcgMTQuMy0zMiAzMi0zMmgxMjhjMTcuNyAwIDMyIDE0LjMgMzIgMzJ2NjRjMCAxNy43LTE0LjMgMzItMzIgMzJoLTEyOGMtMTcuNyAwLTMyLTE0LjMtMzItMzJ2LTY0eiIgY2xhc3M9ImZhZmEtZmEtdy0xNiIvPjwvc3ZnPg==',
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
          className: `bus-marker ${isMoving ? 'moving' : ''}`,
          transform: `rotate(${rotation}deg)`,
          transformOrigin: '50% 50%',
        })}
        ref={markerRef}
      >
        <Popup>
          <strong>{isDriver ? "Your Location" : "Bus Location"}</strong><br />
          Lat: {position.lat.toFixed(6)}<br />
          Lng: {position.lng.toFixed(6)}<br />
          {accuracy && `Accuracy: ${Math.round(accuracy)}m`}
          {isDriver && <div style={{ marginTop: "8px", color: "#ff5b1c" }}>🚍 Broadcasting</div>}
        </Popup>
      </Marker>
    );
  };
  
  // Add styles for the bus marker
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .bus-marker {
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
        z-index: 1000;
        transition: transform 0.3s ease, filter 0.3s ease;
        animation: pulse 2s infinite;
      }
      .bus-marker:hover {
        transform: scale(1.15);
        filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));
        animation: none;
      }
      .bus-marker.moving {
        animation: pulse 1s infinite;
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Initialize user's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    let watchId;
    let lastPosition = null;
    let lastUpdate = 0;
    const MIN_UPDATE_INTERVAL = 1000; // 1 second between updates
    const MIN_DISTANCE = 2; // Minimum distance in meters to trigger update

    const successCallback = (position) => {
      const now = Date.now();
      const { latitude, longitude, accuracy, heading, speed } = position.coords;
      
      // Only update if enough time has passed or significant movement
      if (lastPosition && 
          (now - lastUpdate < MIN_UPDATE_INTERVAL || 
           getDistance(lastPosition, { lat: latitude, lng: longitude }) < MIN_DISTANCE)) {
        return;
      }
      
      lastPosition = { lat: latitude, lng: longitude };
      lastUpdate = now;
      
      console.log("Position update:", { latitude, longitude, accuracy, heading, speed });
      
      // Update position with smooth transition
      setPosition(prev => ({
        ...prev,
        lat: latitude,
        lng: longitude
      }));
      
      setAccuracy(accuracy);
      setLocationError(null);
      
      // Update moving state based on speed
      setIsMoving(speed !== null && speed > 1);
      
      // Add to position history for smoothing
      locationHistory.current = [
        ...locationHistory.current.slice(-(MAX_HISTORY - 1)),
        { 
          lat: latitude, 
          lng: longitude, 
          timestamp: now,
          heading: heading || 0,
          speed: speed || 0
        }
      ];
    };
    
    // Helper function to calculate distance between two coordinates in meters
    const getDistance = (coord1, coord2) => {
      const R = 6371e3; // Earth's radius in meters
      const φ1 = coord1.lat * Math.PI/180;
      const φ2 = coord2.lat * Math.PI/180;
      const Δφ = (coord2.lat - coord1.lat) * Math.PI/180;
      const Δλ = (coord2.lng - coord1.lng) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      return R * c;
    };

    const errorCallback = (error) => {
      console.error("Geolocation error:", error);
      setLocationError(`Error: ${error.message}`);
      
      // Fallback to IP-based geolocation if available
      if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
        navigator.geolocation.getCurrentPosition(
          successCallback,
          (fallbackError) => {
            console.error("Fallback geolocation failed:", fallbackError);
            setLocationError("Could not determine your location. Showing Salem, India by default.");
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
        );
      }
    };

    // Start watching position with high accuracy
    watchId = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0,
        distanceFilter: 1 // Update every 1 meter
      }
    );
    
    // Cleanup function
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Detect if user is driver (has started a session)
  useEffect(() => {
    const driverSession = localStorage.getItem("eppo_session") === "true" && rideId;
    setIsDriver(driverSession);
  }, [rideId]);

  // Driver: Track and publish location with better accuracy
  useEffect(() => {
    if (!isDriver || !rideId || !sessionActive) return;

    if ("geolocation" in navigator) {
      const geolocationOptions = {
        enableHighAccuracy: true,  // Use GPS if available
        timeout: 10000,           // 10 second timeout
        maximumAge: 0,            // Don't use cached position
        distanceFilter: 1          // Update every 1 meter
      };

      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          console.log("Driver position update:", { latitude, longitude, accuracy });
          
          // Update position history
          locationHistory.current = [
            ...locationHistory.current.slice(-(MAX_HISTORY - 1)),
            { lat: latitude, lng: longitude, accuracy, timestamp: Date.now() }
          ];
          
          // Calculate weighted average of recent positions
          if (locationHistory.current.length > 1) {
            const weights = locationHistory.current.map((_, i) => (i + 1) / locationHistory.current.length);
            const totalWeight = weights.reduce((a, b) => a + b, 0);
            
            const avgLat = locationHistory.current.reduce((sum, pos, i) => 
              sum + (pos.lat * weights[i]), 0) / totalWeight;
            const avgLng = locationHistory.current.reduce((sum, pos, i) => 
              sum + (pos.lng * weights[i]), 0) / totalWeight;
            
            setPosition({ lat: avgLat, lng: avgLng });
            setAccuracy(accuracy);
            
            // Publish to Firestore with averaged position
            try {
              await publishLocation(rideId, avgLat, avgLng);
            } catch (error) {
              console.error("Failed to publish location:", error);
            }
          } else {
            // Fallback to current position if not enough history
            setPosition({ lat: latitude, lng: longitude });
            setAccuracy(accuracy);
            
            // Publish to Firestore with current position
            try {
              await publishLocation(rideId, latitude, longitude);
            } catch (error) {
              console.error("Failed to publish location:", error);
            }
          }
        },
        (err) => {
          console.error("Error getting driver location:", {
            code: err.code,
            message: err.message,
            PERMISSION_DENIED: err.PERMISSION_DENIED,
            POSITION_UNAVAILABLE: err.POSITION_UNAVAILABLE,
            TIMEOUT: err.TIMEOUT
          });
          
          setLocationError(`Location error: ${err.message}`);
          
          if (err.code === err.PERMISSION_DENIED) {
            alert("Location access was denied. Please enable location services for this website in your browser settings.");
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            alert("Location information is unavailable. Please check your device's location settings.");
          } else if (err.code === err.TIMEOUT) {
            alert("Location request timed out. Please check your internet connection.");
          }
        },
        geolocationOptions
      );
      setWatchId(id);

      return () => {
        if (id) navigator.geolocation.clearWatch(id);
      };
    }
  }, [isDriver, rideId, sessionActive]);

  // Student: Subscribe to live location updates
  useEffect(() => {
    if (isDriver || !rideId) return;

    const unsubscribe = subscribeToLiveLocation(rideId, (location) => {
      if (location && location.lat && location.lng) {
        setPosition({ lat: location.lat, lng: location.lng });
      }
    });

    return () => unsubscribe();
  }, [isDriver, rideId]);

  const handleEndSession = async () => {
    if (rideId && isDriver) {
      try {
        await stopRideSession(rideId);
        setSessionActive(false);
        localStorage.setItem("eppo_session", "false");
        localStorage.removeItem("eppo_rideId");
        if (watchId) navigator.geolocation.clearWatch(watchId);
      } catch (error) {
        console.error("Failed to end session:", error);
      }
    } else {
      setSessionActive(false);
      localStorage.setItem("eppo_session", "false");
    }
  };

  return (
    <div className="section map-section">
      <div className="glass-topbar">
        <h3 className="map-title">{isDriver ? "Driver View" : "Live Bus"}</h3>
        <div className="map-eta">
          {accuracy && `Accuracy: ${Math.round(accuracy)}m`}
          {isMoving && ' • Moving'}
          {locationError && ` • ${locationError}`}
        </div>
      </div>

      <div className="map-area">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={15}
          style={{ width: "100%", height: "54vh", borderRadius: "14px", boxShadow: "0 12px 30px rgba(11,11,13,0.12)" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <BusMarker 
            position={position}
            isMoving={isMoving}
          />
          
          {accuracy && (
            <Circle
              center={[position.lat, position.lng]}
              radius={accuracy}
              pathOptions={{
                color: '#9d7ae8',
                fillColor: '#9d7ae8',
                fillOpacity: 0.1,
                weight: 1
              }}
            />
          )}
          
          <MapUpdater 
            center={[position.lat, position.lng]} 
            zoom={accuracy > 1000 ? 13 : 15} // Zoom out more if accuracy is low
          />
        </MapContainer>
      </div>

      <div className="map-actions">
        <button className="neon-black-btn" onClick={() => window.location.href="/choose"}>Back</button>
        {isDriver && (
          <button className="secondary-btn" onClick={handleEndSession}>End Session</button>
        )}
      </div>
    </div>
  );
}
