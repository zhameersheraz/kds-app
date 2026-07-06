/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme-aware via CSS variables (defined in index.css).
        // Using rgb() so Tailwind opacity modifiers work (bg-ink/40 etc.)
        ink:    'rgb(var(--c-ink)    / <alpha-value>)',
        paper:  'rgb(var(--c-paper)  / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        line:   'rgb(var(--c-line)   / <alpha-value>)',
        muted:  'rgb(var(--c-muted)  / <alpha-value>)'
      },
      fontFamily: {
        display: ['Georgia', '"Times New Roman"', 'ui-serif', 'serif'],
        sans:    ['ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono:    ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      borderRadius: {
        DEFAULT: '2px',
        sm:      '2px',
        md:      '3px',
        lg:      '4px'
      },
      keyframes: {
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'pulse-ring': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(220, 38, 38, 0.35)' }
        }
      },
      animation: {
        'fade-in':    'fade-in 0.25s ease-out',
        'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite'
      }
    }
  },
  plugins: []
};