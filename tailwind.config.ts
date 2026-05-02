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
        portal: {
          bg: '#000000',
          surface1: '#0A0A0A',
          surface2: '#050505',
          hairline: '#1A1A1A',
          inner: '#1F1F1F',
          text: '#F5F5F5',
          mute: '#8A8A8A',
          tertiary: '#4A4A4A',
          gold: '#C9A961',
          'gold-hover': '#D9B871',
          'gold-deep': '#6B5530',
          error: '#B84A3F',
          success: '#6E8B5A',
        },
      },
      fontFamily: {
        display: ['var(--font-oswald)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-barlow)', 'system-ui', 'sans-serif'],
        portal: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        'portal-display': ['var(--font-inter-tight)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'portal-wide': '0.18em',
        'portal-wider': '0.24em',
        'portal-widest': '0.32em',
      },
    },
  },
  plugins: [],
};

export default config;
