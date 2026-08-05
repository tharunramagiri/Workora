import type { Config } from "tailwindcss";

// Hyperagent design-language tokens (see docs/product/command-center-handoff.md §4.5)
// Surfaces are pure black; text is near-white/gray; the only chromatic accent is blue.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // surfaces
        background: "#000000",           // color.surface.base
        surface: "#0D0D0D",              // color.surface.muted ≈ lab(2.48 0 0)
        "surface-strong": "#0a1628",     // color.surface.strong (dark navy)
        // text
        foreground: "#EBEBEB",           // color.text.primary ≈ lab(93.04 0 0)
        muted: "#A4A4A4",                // color.text.secondary ≈ lab(67.52 0 0)
        "muted-foreground": "#A4A4A4",
        tertiary: "#b2d0fa",             // color.text.tertiary
        // accent
        primary: "#2e63e8",              // hyperagent blue
        accent: "rgba(255,255,255,0.06)",// hover wash (hover:bg-accent)
        // borders
        border: "rgba(58,58,58,0.5)",    // color.border.default ≈ lab(24.6 0 0 / 0.5)
        "border-strong": "rgba(255,255,255,0.1)",
        // status
        ok: "#00d5a6",
        warn: "#ffb527",
        err: "#f94144",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
        ui: ["var(--font-geist-sans)", "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "9999px",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
        sm: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
      },
      transitionDuration: {
        instant: "150ms",
        fast: "200ms",
      },
    },
  },
  plugins: [],
};
export default config;
