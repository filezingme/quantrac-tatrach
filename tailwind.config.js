/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          750: '#293548',
          850: '#151f32', 
          900: '#0f172a'
        }
      }
    },
  },
  plugins: [],
}