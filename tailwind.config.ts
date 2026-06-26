import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0A8043",
        "deep-green": "#063D21",
        "dark-surface": "#0E1F15",
        gold: "#C8941E",
        "soft-gold": "#F4E2BC",
        canvas: "#F2F7F4",
        card: "#FFFFFF",
        soft: "#EFF6F1",
        line: "#E3ECE6",
        ink: "#13241B",
        muted: "#5E6F65",
        danger: "#C0564B",
        info: "#2E6F8E",
      },
      fontFamily: {
        heading: ["var(--font-cairo)", "Cairo", "sans-serif"],
        body: ["var(--font-tajawal)", "Tajawal", "sans-serif"],
        mono: ["var(--font-plex-mono)", "IBM Plex Mono", "monospace"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(6, 61, 33, 0.06)",
        "soft-lg": "0 8px 30px rgba(6, 61, 33, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
