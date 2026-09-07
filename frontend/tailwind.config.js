/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Urdu-script Copilot messages: Nastaliq webfont (already loaded in
        // index.css) with system Urdu-capable fallbacks so text still
        // renders correctly even before/without the webfont.
        urdu: [
          '"Noto Nastaliq Urdu"',
          '"Jameel Noori Nastaleeq"',
          '"Alvi Nastaleeq"',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        ink: {
          50: 'rgb(var(--ink-50-rgb) / <alpha-value>)',
          100: 'rgb(var(--ink-100-rgb) / <alpha-value>)',
          200: 'rgb(var(--ink-200-rgb) / <alpha-value>)',
          300: 'rgb(var(--ink-300-rgb) / <alpha-value>)',
          400: 'rgb(var(--ink-400-rgb) / <alpha-value>)',
          500: 'rgb(var(--ink-500-rgb) / <alpha-value>)',
          600: 'rgb(var(--ink-600-rgb) / <alpha-value>)',
          700: 'rgb(var(--ink-700-rgb) / <alpha-value>)',
          800: 'rgb(var(--ink-800-rgb) / <alpha-value>)',
          900: 'rgb(var(--ink-900-rgb) / <alpha-value>)',
          950: 'rgb(var(--ink-950-rgb) / <alpha-value>)',
        },
        gold: {
          50: 'rgb(var(--light-green-rgb, var(--dark-green-rgb)) / <alpha-value>)',
          100: 'rgb(var(--light-green-rgb, var(--dark-green-rgb)) / <alpha-value>)',
          200: 'rgb(var(--gold-rgb) / <alpha-value>)',
          300: 'rgb(var(--gold-rgb) / <alpha-value>)',
          400: 'rgb(var(--gold-rgb) / <alpha-value>)',
          500: 'rgb(var(--gold-rgb) / <alpha-value>)',
          600: 'rgb(var(--gold-rgb) / <alpha-value>)',
          700: 'rgb(var(--gold-rgb) / <alpha-value>)',
        },
        red: {
          50: 'rgb(var(--danger-soft-rgb) / <alpha-value>)',
          100: 'rgb(var(--danger-soft-rgb) / <alpha-value>)',
          200: 'rgb(var(--danger-rgb) / <alpha-value>)',
          300: 'rgb(var(--danger-rgb) / <alpha-value>)',
          400: 'rgb(var(--danger-rgb) / <alpha-value>)',
          500: 'rgb(var(--danger-rgb) / <alpha-value>)',
          600: 'rgb(var(--danger-rgb) / <alpha-value>)',
          700: 'rgb(var(--danger-rgb) / <alpha-value>)',
          900: 'rgb(var(--danger-rgb) / <alpha-value>)',
          950: 'rgb(var(--danger-soft-rgb) / <alpha-value>)',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--shadow-rgb) / 0.06), 0 8px 24px rgb(var(--shadow-rgb) / 0.08)',
        hover: '0 2px 4px rgb(var(--shadow-rgb) / 0.08), 0 12px 28px rgb(var(--shadow-rgb) / 0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 240ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'count-up': 'count-up 280ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
