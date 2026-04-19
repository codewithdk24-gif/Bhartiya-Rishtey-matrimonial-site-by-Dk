/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9b1c31',
          light: '#be3249',
          dark: '#7a1526',
        },
        accent: {
          DEFAULT: '#C5A059',
          light: '#F5E6CC',
        },
        gold: {
          DEFAULT: '#C5A059',
          light: '#FBF4E9',
        },
        error: '#B91C1C',
        success: '#065F46',
        warning: '#92400E',
      },
      fontFamily: {
        headline: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
