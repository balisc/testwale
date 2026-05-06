import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0A192F',
        accent: '#D4AF37',
        hoverbg: '#162A45',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(212, 175, 55, 0.15), 0 20px 50px rgba(0,0,0,0.35)',
      },
      fontFamily: {
        heading: ['var(--font-lora)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
