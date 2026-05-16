/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#7c3aed', 50: '#f5f3ff', 100: '#ede9fe', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
        income:   { DEFAULT: '#059669', light: '#d1fae5', dark: '#065f46' },
        expense:  { DEFAULT: '#e11d48', light: '#ffe4e6', dark: '#9f1239' },
        saving:   { DEFAULT: '#2563eb', light: '#dbeafe', dark: '#1e40af' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.25s ease-out',
        'slide-up':  'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },                                         '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' },          '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      boxShadow: {
        card:  '0 2px 16px 0 rgba(0,0,0,0.08)',
        float: '0 8px 32px 0 rgba(124,58,237,0.18)',
      },
    },
  },
  plugins: [],
};
