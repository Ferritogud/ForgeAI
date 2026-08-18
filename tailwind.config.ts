import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#16162A",
          deep: "#0D0D1A",
          raised: "#1D1D3D",
          line: "#2A2A4F",
        },
        blue: {
          glow: "#00D4FF",
          core: "#3B82F6",
          dim: "#1E3A5F",
        },
        amber: {
          DEFAULT: "#E8590C",
          bright: "#FF7A29",
        },
        ink: {
          primary: "#E8F1FF",
          secondary: "#8CA0C6",
          faint: "#526088",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        "glow-blue-sm": "0 0 8px 0 rgba(0, 212, 255, 0.35)",
        "glow-blue": "0 0 24px 0 rgba(0, 212, 255, 0.25), 0 0 2px 0 rgba(0, 212, 255, 0.6)",
        "glow-blue-lg": "0 0 48px 0 rgba(0, 212, 255, 0.3), 0 0 4px 0 rgba(0, 212, 255, 0.7)",
        "glow-amber": "0 0 24px 0 rgba(232, 89, 12, 0.45), 0 0 2px 0 rgba(255, 122, 41, 0.8)",
        "glow-amber-lg": "0 0 40px 0 rgba(232, 89, 12, 0.55), 0 0 4px 0 rgba(255, 122, 41, 0.9)",
      },
      keyframes: {
        "scan-line": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "grid-drift": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "80px 80px" },
        },
      },
      animation: {
        "scan-line": "scan-line 2.4s linear infinite",
        "pulse-glow": "pulse-glow 2.6s ease-in-out infinite",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "border-flow": "border-flow 3s linear infinite",
        blink: "blink 1s step-start infinite",
        "grid-drift": "grid-drift 6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
