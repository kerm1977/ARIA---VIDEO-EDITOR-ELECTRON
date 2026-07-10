/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'video-dark': '#1a1a1a',
        'video-darker': '#0d0d0d',
        'video-accent': '#6366f1',
        'video-accent-hover': '#4f46e5',
      },
    },
  },
  plugins: [],
}
