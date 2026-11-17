import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          black: '#050811',
          card: '#0a101f',
          surface: '#111d35',
          border: '#1e2f50',
          cyan: '#00f0ff',
          emerald: '#05ffa1',
          amber: '#ffb800',
          purple: '#9d4edd',
          rose: '#ff0055',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px rgba(0, 240, 255, 0.25)',
        'cyan-glow-lg': '0 0 35px rgba(0, 240, 255, 0.45)',
        'emerald-glow': '0 0 20px rgba(5, 255, 161, 0.25)',
        'amber-glow': '0 0 20px rgba(255, 184, 0, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
