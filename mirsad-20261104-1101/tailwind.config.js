/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: "#D4AF37",
        navy: {
          900: "#0B1329",
          800: "#131B36",
        },
      },
    },
  },
  plugins: [],
};