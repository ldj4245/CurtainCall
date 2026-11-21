/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#242424',
        },
        ink: {
          darkest: '#202020',
          darker: '#242424',
          dark: '#292929',
          base: '#333333',
          muted: '#555555',
          light: '#666666',
          lighter: '#777777',
          lightest: '#999999',
        },
        surface: {
          base: '#fbfbfb',
          alt: '#f5f5f5',
          muted: '#eeeeee',
          background: '#e8e8e8',
        },
        line: {
          lightest: '#eeeeee',
          lighter: '#e9e9e9',
          light: '#e2e2e2',
          base: '#d8d8d8',
          dark: '#282828',
        }
      },
      fontFamily: {
        sans: ['Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      },
      borderRadius: {
        none: '0',
        sm: '1px',
        DEFAULT: '2px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '12px',
        full: '9999px',
      },
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        mockup: '0 18px 42px rgba(0,0,0,0.10)',
      }
    },
  },
  plugins: [],
}
