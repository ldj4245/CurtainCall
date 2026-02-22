/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#111111',
          50: '#f7f7f7',
          100: '#eeeeee',
          200: '#e0e0e0',
          300: '#cccccc',
          500: '#666666',
          600: '#333333',
          700: '#222222',
          800: '#111111',
          900: '#000000',
        },
        accent: {
          red: '#FF4B4B',
          'red-bg': '#FFF0F0',
          blue: '#3B82F6',
          'blue-bg': '#EFF6FF',
          purple: '#7C3AED',
          'purple-bg': '#F3F0FF',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Apple SD Gothic Neo', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
      },
    },
  },
  plugins: [],
}
