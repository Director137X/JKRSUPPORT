import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#c9a227',
        'gold-bright': '#EAB308',
        ink: '#000000',
        panel: '#0b0c0f',
        surface: '#15181C',
        'surface-2': '#1A1D23',
        line: '#2A2E35',
      },
      fontFamily: {
        display: ['var(--font-oswald)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-barlow)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
