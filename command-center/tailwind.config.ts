import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0c0a09", surface: "#1c1917", "surface-strong": "#292524",
        ink: "#e7e5e4", muted: "#a8a29e", accent: "#f97316", "accent-soft": "rgba(249,115,22,0.14)",
        ok: "#16a34a", warn: "#b9770e", err: "#dc2626", hair: "#292524", "hair-strong": "#44403c",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"], display: ["EB Garamond", "Georgia", "serif"] },
    },
  },
  plugins: [],
};
export default config;
