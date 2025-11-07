import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./packages/web-browser/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'browser-bg': '#0f0f1e',
        'browser-surface': '#1a1a2e',
        'browser-border': '#2a2a3e',
        'browser-primary': '#3b82f6',
        'browser-secondary': '#6366f1',
        'browser-accent': '#8b5cf6',
        'browser-text': '#f3f4f6',
        'browser-text-muted': '#9ca3af',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
} satisfies Config