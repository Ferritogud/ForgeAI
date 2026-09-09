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
        base: "var(--bg)",
        card: "var(--card)",
        "card-muted": "var(--card-muted)",
        line: "var(--border)",
        ink: {
          primary: "var(--ink-primary)",
          secondary: "var(--ink-secondary)",
          faint: "var(--ink-faint)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
        },
        warn: {
          DEFAULT: "var(--warn)",
          soft: "var(--warn-soft)",
        },
        momentum: {
          DEFAULT: "var(--momentum)",
          soft: "var(--momentum-soft)",
        },
        success: {
          DEFAULT: "var(--success)",
          soft: "var(--success-soft)",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
      },
      fontSize: {
        // Fills the one real gap in Tailwind's default scale: a single
        // "micro" size for mono badges/pills/eyebrows that previously used
        // three near-identical arbitrary values (0.6rem/0.65rem/0.7rem)
        // interchangeably across components.
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        // Plays once whenever a checkbox's :checked state turns on (pure
        // CSS pseudo-class transition, so it never replays on unrelated
        // re-renders) — a satisfying snap instead of a flat opacity fade.
        "check-pop": {
          "0%": { transform: "scale(0.6)" },
          "60%": { transform: "scale(1.15)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "check-pop": "check-pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
