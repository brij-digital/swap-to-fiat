/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'swap-dark': '#0d1117',
        'swap-card': '#161b22',
        'swap-border': '#30363d',
        'swap-accent': '#7c3aed',
        'swap-green': '#22c55e',
      }
    },
  },
  plugins: [],
}
