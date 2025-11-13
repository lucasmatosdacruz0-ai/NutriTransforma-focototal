/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': {
          light: '#E6F8F0',
          DEFAULT: '#00B894',
          dark: '#00896B',
        },
        'brand-blue': {
          light: '#EBF5FF',
          DEFAULT: '#3498DB',
          dark: '#2980B9',
        },
        'brand-orange': {
          light: '#FFF4E6',
          DEFAULT: '#F39C12',
        },
        'brand-yellow': {
          light: '#FEF9E7',
          DEFAULT: '#F1C40F',
        }
      }
    },
  },
  plugins: [
    function({ addVariant }) {
      addVariant('theme-athlete', '.theme-athlete &');
    }
  ],
}