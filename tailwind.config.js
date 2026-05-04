/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./store/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        "primary-hover": "#1d4ed8",
        bg: "#f8fafc",
        surface: "#ffffff",
        border: "#e5e7eb",
        "text-main": "#0f172a",
        "text-muted": "#64748b",
        success: "#22c55e",
        danger: "#dc2626",
        // Compatibility aliases while existing components are migrated.
        "primary-dark": "#1d4ed8",
        background: "#f8fafc",
        "surface-dark": "#0F172A",
        text: "#0f172a",
        muted: "#64748b"
      },
      spacing: {
        section: "80px",
        container: "1200px"
      },
      maxWidth: {
        container: "1200px"
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "16px"
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.05)",
        hover: "0 8px 30px rgba(0,0,0,0.08)",
        primary: "0 22px 70px rgba(15,23,42,0.12), 0 1px 0 rgba(255,255,255,0.7) inset",
        secondary: "0 10px 30px rgba(15,23,42,0.07)",
        elevated: "0 30px 90px rgba(15,23,42,0.16)",
        "dark-primary": "0 24px 80px rgba(0,0,0,0.34), 0 1px 0 rgba(255,255,255,0.08) inset",
        card: "0 4px 20px rgba(0,0,0,0.05)",
        glow: "0 24px 90px rgba(37, 99, 235, 0.22)",
        "soft-ring": "0 0 0 1px rgba(37, 99, 235, 0.08), 0 18px 55px rgba(15, 23, 42, 0.08)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        float: "float 7s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

module.exports = config;
