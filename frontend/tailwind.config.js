/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ruby: {
          50:  '#FFF0F0',
          100: '#FFD6D6',
          200: '#FFB3B3',
          300: '#FF8080',
          400: '#FF4D4D',
          500: '#E63030',
          600: '#C0392B',
          700: '#9B1C1C',
          800: '#7B1111',
          900: '#5E0A0A',
        },
        blush: {
          50:  '#FFF5F7',
          100: '#FFDDE5',
          200: '#FFB3C6',
          300: '#FF85A7',
          400: '#FF5788',
          500: '#E8406E',
        },
        cream: '#FDF8F5',
        gold: '#C9A84C',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'sans-serif'],
        accent: ['"Playfair Display"', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
      }
    },
  },
  plugins: [],
}
