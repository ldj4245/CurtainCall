/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#8b2252',
          50: '#fdf2f7',
          100: '#fce7f1',
          200: '#fbcfe4',
          300: '#f9a8cc',
          400: '#f472aa',
          500: '#e84d8a',
          600: '#8b2252',
          700: '#7a1d47',
          800: '#651a3c',
          900: '#551b35',
        },
        gold: {
          DEFAULT: '#c9a84c',
          50: '#faf6eb',
          100: '#f3eacc',
          200: '#e8d69d',
          300: '#d9bc65',
          400: '#c9a84c',
          500: '#b8923a',
          600: '#9a7430',
          700: '#7c5828',
          800: '#684a27',
          900: '#5a3f26',
        },
        warm: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#ece8e3',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Apple SD Gothic Neo', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        'card-sm': '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card-md': '0 4px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        'card-lg': '0 8px 24px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
      },
    },
  },
  plugins: [],
}
