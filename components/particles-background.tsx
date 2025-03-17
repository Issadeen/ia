"use client"

import { useTheme } from "next-themes"
import Particles from "react-tsparticles"
import type { Container } from "tsparticles-engine"
import { loadSlim } from "tsparticles-slim"

export function ParticlesBackground() {
  const { theme } = useTheme()

  const particlesInit = async (main: any) => {
    await loadSlim(main)
  }

  const particlesLoaded = async (container?: Container): Promise<void> => {
    // Optional: Add any initialization after particles are loaded
  }

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      className="fixed inset-0 -z-10"
      options={{
        particles: {
          number: { value: 50, density: { enable: true, value_area: 800 } },
          color: { value: theme === "dark" ? "#ffffff" : "#000000" },
          opacity: { value: 0.1 },
          size: { value: 3 },
          move: {
            enable: true,
            speed: 1,
            random: true,
          },
          links: {
            enable: true,
            distance: 150,
            color: theme === "dark" ? "#ffffff" : "#000000",
            opacity: 0.1,
            width: 1,
          },
        },
        interactivity: {
          events: {
            onhover: { enable: true, mode: "grab" },
            onclick: { enable: true, mode: "push" },
          },
        },
        background: {
          color: "transparent",
        },
      }}
    />
  )
}
