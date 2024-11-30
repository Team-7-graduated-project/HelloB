/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      lineClamp: {
        1: "1",
        2: "2",
        3: "3",
      },
      colors: {
        primary: {
          DEFAULT: "#0EA5E9",
          dark: "#0284C7",
        },
        secondary: {
          DEFAULT: "#F97316",
          dark: "#EA580C",
        },
      },
      animation: {
        fadeIn: "fadeIn 1s ease-in forwards",
        fadeInDelay: "fadeIn 1s ease-in 0.3s forwards",
        fadeInUp: "fadeInUp 0.6s ease-out forwards",
        slideDown: "slideDown 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        slideDown: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
