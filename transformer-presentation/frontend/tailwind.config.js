/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          950: "#05060f",
          900: "#0a0c1b",
          800: "#11142a",
          700: "#1a1e3a",
          600: "#272c52",
        },
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(56, 189, 248, 0.45)",
        "glow-purple": "0 0 40px -8px rgba(168, 85, 247, 0.5)",
      },
    },
  },
  plugins: [],
};
