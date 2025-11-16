import React from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function ParticlesBackground() {
  const particlesInit = async (engine) => {
    try {
      await loadFull(engine);
    } catch (error) {
      console.warn("Particles failed to load:", error);
      // Fallback - particles will still work with basic config
    }
  };

  const particlesLoaded = () => {};

  // Enhanced interactive aura particle animation - glass violet theme
  const options = {
    fullScreen: { enable: false },
    fpsLimit: 120,
    particles: {
      number: { 
        value: 40, 
        density: { enable: true, area: 800 } 
      },
      color: { 
        value: ["#e8e8f0", "#d5d5e0", "#c2c2d0", "#ffffff", "#f0f0f5", "#dadae5", "#ebebf0"],
      },
      shape: { 
        type: "circle",
      },
      opacity: { 
        value: 0.15, 
        random: { enable: true, minimumValue: 0.08, maximumValue: 0.25 },
        animation: {
          enable: true,
          speed: 1,
          minimumValue: 0.08,
          maximumValue: 0.25,
          sync: false
        }
      },
      size: { 
        value: { min: 1, max: 4 },
        random: { enable: true },
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 1,
          maximumValue: 4,
          sync: false
        }
      },
      move: { 
        enable: true, 
        speed: { min: 0.5, max: 2 },
        direction: "none", 
        outModes: { 
          default: "bounce",
          bottom: "bounce",
          left: "bounce",
          right: "bounce",
          top: "bounce"
        },
        random: true,
        straight: false,
        attract: {
          enable: true,
          rotateX: 600,
          rotateY: 1200
        }
      },
      links: { 
        enable: true,
        distance: 120,
        color: "#e8e8f0",
        opacity: 0.08,
        width: 0.5,
        triangles: {
          enable: true,
          opacity: 0.02
        }
      },
      collisions: {
        enable: true,
        mode: "bounce"
      }
    },
    interactivity: {
      detectsOn: "canvas",
      events: {
        onHover: { 
          enable: true,
          mode: ["grab", "bubble", "repulse"],
          parallax: {
            enable: true,
            force: 2,
            smooth: 10
          }
        },
        onClick: { 
          enable: true,
          mode: "push"
        },
        resize: true,
      },
      modes: {
        grab: {
          distance: 200,
          links: {
            opacity: 0.15,
            color: "#e8e8f0"
          }
        },
        bubble: {
          distance: 250,
          size: 6,
          duration: 2,
          opacity: 0.2,
          speed: 3
        },
        repulse: {
          distance: 150,
          duration: 0.4,
          speed: 1
        },
        push: {
          particles_nb: 4,
          quantity: 2
        }
      }
    },
    detectRetina: true,
    background: { color: "transparent" },
  };

  // container style ensures it sits behind UI but covers viewport
  return (
    <>
      <div className="particles-fallback" />
      <div className="particles-wrap">
        <Particles init={particlesInit} loaded={particlesLoaded} options={options} />
      </div>
    </>
  );
}
