import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        maya: {
          obsidian: "#0B0F14",
          gold: "#D4AF37",
          jade: "#2ECC71",
          turquoise: "#4ECDC4",
          clay: "#8B4513",
          parchment: "#F7F3E9",
        },
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        sans: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
