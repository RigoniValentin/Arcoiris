/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Arcoiris Joyería Brand Colors
        "arcoiris-teal": {
          50: "#e6f2f2",
          100: "#b3d9d9",
          200: "#80bfbf",
          300: "#4da6a6",
          400: "#267878",
          500: "#0E4E4E",
          600: "#0c4343",
          700: "#093636",
          800: "#072a2a",
          900: "#041d1d",
        },
        "arcoiris-light": {
          50: "#f7fbfc",
          100: "#edf6f8",
          200: "#D6ECF0",
          300: "#b8dde4",
          400: "#9aced8",
          500: "#7cbfcc",
        },
        "arcoiris-gold": {
          50: "#fdf8ec",
          100: "#f8ecd0",
          200: "#f0d9a0",
          300: "#E5C872",
          400: "#CAA135",
          500: "#B8902F",
          600: "#A6842B",
          700: "#7F6520",
          800: "#5a4213",
          900: "#37290c",
        },
        "arcoiris-dark": "#0E4E4E",
        "arcoiris-cream": "#D6ECF0",
        // Legacy colors
        "gray-20": "#F8F4EB",
        "gray-50": "#EFE6E6",
        "gray-100": "#DFCCCC",
        "gray-500": "#5E0000",
        "primary-100": "#D6ECF0",
        "primary-300": "#CAA135",
        "primary-500": "#0E4E4E",
        "secondary-400": "#CAA135",
        "secondary-500": "#B8902F",
      },
      backgroundImage: (theme) => ({
        "gradient-yellowred":
          "linear-gradient(90deg, #FF616A 0%, #FFC837 100%)",
        "mobile-home": "url('./assets/HomePageGraphic.png')",
        "gradient-opacity":
          "linear-gradient(to bottom, rgba(0, 0, 0, 0) 20%, rgba(0, 0, 0, 1) 80%)",
      }),
      fontFamily: {
        dmsans: ["DM Sans", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
        playfair: ["Playfair Display", "serif"],
      },
      content: {
        evolvetext: "url('./assets/EvolveText.png')",
        abstractwaves: "url('./assets/AbstractWaves.png')",
        sparkles: "url('./assets/Sparkles.png')",
        circles: "url('./assets/Circles.png')",
      },
    },
    screens: {
      xs: "480px",
      sm: "768px",
      md: "1060px",
    },
  },
  plugins: [],
};
