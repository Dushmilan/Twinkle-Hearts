/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        twinkle: {
          canvas: '#F5F7F6',
          sky: '#DDE7EE',
          mist: '#E5E1F4',
          blush: '#F3C5C1',
          ink: '#1A2844',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'Noto Serif Sinhala', 'Noto Serif Tamil', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
        tamil: ['Noto Serif Tamil', 'serif'],
        sinhala: ['Noto Serif Sinhala', 'serif'],
        serif: ['Geist Mono', 'monospace'],
      },
      boxShadow: {
        'paper': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'paper-md': '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
        'paper-lg': '0 8px 24px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.06)',
        'press': 'inset 0 1px 2px rgba(0, 0, 0, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.6)',
        'letterpress': 'inset 0 1px 0 rgba(255, 255, 255, 0.6), 0 1px 2px rgba(0, 0, 0, 0.08)',
        'blush': '0 4px 12px rgba(243, 197, 193, 0.25), 0 1px 3px rgba(243, 197, 193, 0.15)',
      },
      borderRadius: {
        'card': '12px',
        'container': '2rem',
        'seal': '50%',
      },
      letterSpacing: {
        'display': '-0.02em',
        'tight-display': '-0.03em',
        'wide-display': '0.02em',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'press': 'cubic-bezier(0.12, 0, 0.39, 0)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'breathe': 'breathe 3s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'marquee': 'marquee 30s linear infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'stamp': 'stamp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'ink-spread': 'inkSpread 0.8s ease-out forwards',
        'press-in': 'pressIn 0.15s ease-out forwards',
      },
      keyframes: {
        fadeUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.02)', opacity: '0.9' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        stamp: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        inkSpread: {
          '0%': { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },
        pressIn: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.97)' },
        },
      },
    },
  },
  plugins: [],
}
