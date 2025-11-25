import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "wave-speaking": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.8)", opacity: "0.3" },
        },
        "wave-listening": {
          "0%, 100%": { transform: "scale(1.2)", opacity: "0.4" },
          "50%": { transform: "scale(1.5)", opacity: "0.8" },
        },
        "wave-thinking": {
          "0%, 100%": { transform: "scale(1)", opacity: "0.7" },
          "50%": { transform: "scale(1.08)", opacity: "0.95" },
        },
        "center-speaking": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
        },
        "center-listening": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.95)" },
        },
        "center-thinking": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "wave-speaking": "wave-speaking 1.6s ease-in-out infinite",
        "wave-listening": "wave-listening 1.8s ease-in-out infinite",
        "wave-thinking": "wave-thinking 1.8s ease-in-out infinite",
        "center-speaking": "center-speaking 1.6s ease-in-out infinite",
        "center-listening": "center-listening 1.6s ease-in-out infinite",
        "center-thinking": "center-thinking 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
