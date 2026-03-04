/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#030508',
        accent: '#00f5d4',
        easy: '#23d18b',
        medium: '#f5a623',
        hard: '#ff3860'
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
