import React, { useContext, useEffect, useState, useRef } from "react";
import { SessionContext } from "../App";
import { subscribeToLiveLocation, publishLocation, stopRideSession } from "../services/sessionService";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom component to update map center when position changes
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapView() {
  const { sessionActive, setSessionActive } = useContext(SessionContext);
  const [position, setPosition] = useState({ lat: 12.9716, lng: 77.5946 });
  const [rideId, setRideId] = useState(() => localStorage.getItem("eppo_rideId"));
  const [isDriver, setIsDriver] = useState(false);
  const [watchId, setWatchId] = useState(null);

  // Custom bus icon for Leaflet
  const busIcon = L.divIcon({
    className: 'custom-bus-marker',
    html: '<div style="background-color: #9d7ae8; width: 24px; height: 24px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  // Detect if user is driver (has started a session)
  useEffect(() => {
    const driverSession = localStorage.getItem("eppo_session") === "true" && rideId;
    setIsDriver(driverSession);
  }, [rideId]);

  // Driver: Track and publish location
  useEffect(() => {
    if (!isDriver || !rideId || !sessionActive) return;

    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition({ lat: latitude, lng: longitude });
          
          // Publish to Firestore
          try {
            await publishLocation(rideId, latitude, longitude);
          } catch (error) {
            console.error("Failed to publish location:", error);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
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
        <div className="map-eta">ETA: 8 min</div>
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
          <Marker position={[position.lat, position.lng]} icon={busIcon}>
            <Popup>
              <strong>{isDriver ? "Your Location" : "Bus Location"}</strong><br />
              Lat: {position.lat.toFixed(4)}<br />
              Lng: {position.lng.toFixed(4)}
              {isDriver && <div style={{ marginTop: "8px", color: "#9d7ae8" }}>📍 Broadcasting</div>}
            </Popup>
          </Marker>
          <MapUpdater center={[position.lat, position.lng]} />
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
