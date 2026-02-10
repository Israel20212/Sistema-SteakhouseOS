/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary, 5 5 5) / <alpha-value>)',
          panel: 'rgb(var(--color-primary, 15 15 15) / 0.8)', // Semi-transparent panel
          glass: 'rgb(255 255 255 / 0.05)'
        },
        gold: {
          DEFAULT: 'rgb(var(--color-accent, 212 175 55) / <alpha-value>)',
          hover: 'rgb(var(--color-accent, 212 175 55) / 0.8)',
          dim: 'rgb(var(--color-accent, 212 175 55) / 0.6)'
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent, 212 175 55) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary, 255 255 255) / <alpha-value>)',
        },
        danger: {
          DEFAULT: '#8a0000',
          hover: '#a00000'
        },
        success: '#1a472a', // Dark green for success
        warning: '#b08d00', // Gold/Yellowish for warnings
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Lato', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}
