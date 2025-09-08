/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // TITO HR Custom Color Palette
        'text-primary': '#0F0F0F',
        'text-secondary': '#6B7280',
        'background-primary': '#FAF9EE',
        'background-secondary': '#EEEEEE',
        'button-primary': '#181C14',
        'button-secondary': '#F8FAFC',
      }
    },
  },
  plugins: [],
}
