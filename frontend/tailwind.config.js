/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm, greeting-card inspired palette
        cream: {
          50: '#FDF8F4',
          100: '#FBF1EB',
          200: '#F5E0D3',
        },
        coral: {
          50: '#FFF1ED',
          100: '#FFE0D6',
          200: '#FFC4B3',
          300: '#FF9E87',
          400: '#F27A5C',
          500: '#E8734A',  // Primary brand color
          600: '#D45A34',
          700: '#B04628',
          800: '#8F3822',
          900: '#75301E',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E3EBE3',
          200: '#C5D6C5',
          300: '#9BB89B',
          400: '#729A72',
          500: '#527D52',
          600: '#3D613D',
          700: '#314D31',
        },
        gold: {
          50: '#FFFDF5',
          100: '#FFF8E1',
          200: '#FFECB3',
          300: '#FFD96E',
          400: '#FFC53D',
          500: '#E6A817',
          600: '#CC8A0E',
        },
        rose: {
          50: '#FFF0F3',
          100: '#FFE0E8',
          200: '#FFC1D1',
          300: '#FF8FAB',
          400: '#FF5C8A',
          500: '#E0406E',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#128C7E',
          light: '#DCF8C6',
        },
      },
      fontFamily: {
        display: ['Cormorant', 'Georgia', 'serif'],
        body: ['DM Sans', 'Noto Sans', 'system-ui', 'sans-serif'],
        sinhala: ['Noto Sans', 'sans-serif'],
        tamil: ['Noto Sans', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-lift': '0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)',
        'soft': '0 1px 4px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(232, 115, 74, 0.15)',
      },
      borderRadius: {
        'card': '12px',
        'pill': '999px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'sparkle': 'sparkle 0.6s ease-out forwards',
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'fade-up-stagger': 'fadeUp 0.5s ease-out forwards',
        'heart-pop': 'heartPop 0.4s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        sparkle: {
          '0%': { transform: 'scale(0) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.2) rotate(180deg)', opacity: '0.8' },
          '100%': { transform: 'scale(0) rotate(360deg)', opacity: '0' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        heartPop: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.3)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #FDF8F4 0%, #FBF1EB 100%)',
        'hero-gradient': 'linear-gradient(180deg, rgba(253, 248, 244, 0.95) 0%, rgba(251, 241, 235, 0.85) 100%)',
        'card-gradient': 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.03) 100%)',
      },
    },
  },
  plugins: [],
}
