/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0e17',
        panel: '#111726',
        'panel-2': '#161d2e',
        edge: '#202a40',
        up: '#16c784',
        down: '#ea3943',
        muted: '#8a93a6',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        flashUp: { '0%': { backgroundColor: 'rgba(22,199,132,0.18)' }, '100%': { backgroundColor: 'transparent' } },
        flashDown: { '0%': { backgroundColor: 'rgba(234,57,67,0.18)' }, '100%': { backgroundColor: 'transparent' } },
      },
      animation: {
        flashUp: 'flashUp 0.6s ease-out',
        flashDown: 'flashDown 0.6s ease-out',
      },
    },
  },
  plugins: [],
};
