import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Legacy brand scale (still used in Settings pages + existing UI) ──
        brand: {
          50:  "#f0f4ff",
          100: "#dce6ff",
          500: "#4f6ef7",
          600: "#3b58e8",
          700: "#2d46c9",
        },
        // ── Stitch AI design tokens ────────────────────────────────────────
        primary:            "#3713ec",
        "background-dark":  "#131022",
        "background-light": "#f6f6f8",
        "accent-gold":      "#FFD700",
        "accent-silver":    "#C0C0C0",
        "accent-bronze":    "#CD7F32",
      },
    },
  },
  plugins: [],
};

export default config;
