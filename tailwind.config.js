/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1E5631",
        inkDeep: "#0F3A1F",
        gold: "#6E736E",
        paper: "#F5F6F3",
        paperDeep: "#E8EAE5",
        line: "#D3D8D0",
        sage: "#3F7A52",
        rust: "#8C3B3B",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
