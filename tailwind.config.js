/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/views/**/*.{html,js,ejs}",
    "./src/public/**/*.{html,js}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"],
  }
}
