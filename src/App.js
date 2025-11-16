import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import IntroScreen from "./components/IntroScreen";
import DriverLogin from "./components/DriverLogin";
import StudentTracks from "./components/StudentTracks";
import MapView from "./components/MapView";
import NavDrawer from "./components/NavDrawer";
import ParticlesBackground from "./components/ParticlesBackground";
import ChooseRole from "./components/ChooseRole";
import { startAutoSessionScheduler } from "./services/scheduleService";

export const SessionContext = React.createContext();

function App() {
  const [isMounted, setIsMounted] = useState(false);
  const [sessionActive, setSessionActive] = useState(() => {
    // persisted session state
    return localStorage.getItem("eppo_session") === "true";
  });
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Ensure app is fully mounted before showing content
  useEffect(() => {
    // Use requestAnimationFrame to ensure smooth transition after initial render
    requestAnimationFrame(() => {
      setIsMounted(true);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("eppo_session", sessionActive ? "true" : "false");
  }, [sessionActive]);

  // listen to storage changes (multi-tab)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "eppo_session") {
        setSessionActive(e.newValue === "true");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Auto-session scheduler (7:45 AM - 9:00 AM)
  useEffect(() => {
    const cleanup = startAutoSessionScheduler((result) => {
      if (result.autoStarted) {
        console.log("Auto-session started:", result.message);
        setSessionActive(true);
        localStorage.setItem("eppo_session", "true");
        localStorage.setItem("eppo_rideId", result.rideId);
        
        // Show notification to user
        if (Notification.permission === "granted") {
          new Notification("Bus Session Started", {
            body: "Auto-session started for 7:45 AM - 9:00 AM",
            icon: "/logo192.png"
          });
        }
      }
    });

    return cleanup;
  }, []);

  // show nav after leaving intro
  const [seenIntro, setSeenIntro] = useState(() => {
    return localStorage.getItem("eppo_seen_intro") === "true";
  });

  const markIntroSeen = () => {
    setSeenIntro(true);
    localStorage.setItem("eppo_seen_intro", "true");
    navigate("/choose");
  };

  // Show loading state until app is mounted
  if (!isMounted) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg, #0b0d13 0%, #0a0c12 30%, #090b10 60%, #08090e 100%)',
        color: '#ffffff',
        fontSize: '18px',
        fontWeight: 600,
        zIndex: 99999,
        margin: 0,
        padding: 0
      }}>
        Loading...
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ sessionActive, setSessionActive }}>
      <div className="app-root">
        {/* particles background layer */}
        <ParticlesBackground />

        {/* top-left nav button visible after intro, but not on intro screen */}
        {seenIntro && location.pathname !== "/" && (
          <button
            className="nav-toggle"
            onClick={() => setNavOpen((s) => !s)}
            aria-label="Open navigation"
          >
            ☰
          </button>
        )}

        {seenIntro && location.pathname !== "/" && <NavDrawer open={navOpen} onClose={() => setNavOpen(false)} />}

        <div className="app-pages">
          <Routes>
            <Route path="/" element={<IntroScreen onContinue={markIntroSeen} />} />
            <Route path="/choose" element={<ChooseRole />} />
            <Route path="/driver" element={<DriverLogin />} />
            <Route path="/student" element={<StudentTracks />} />
            <Route path="/map" element={<MapView />} />
          </Routes>
        </div>
      </div>
    </SessionContext.Provider>
  );
}

export default App;
