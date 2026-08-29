/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#9d2244',
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
          base: '#ffffff',
          alt: '#fbfbfb',
          muted: '#f6f4f2',
          background: '#f2f2f1',
        },
        line: {
          lightest: '#ededed',
          lighter: '#e7e7e7',
          light: '#e4e4e4',
          base: '#dedede',
          dark: '#282828',
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'Apple SD Gothic Neo', 'sans-serif'],
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
