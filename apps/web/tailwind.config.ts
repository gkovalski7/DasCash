import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        sans:    ['"DM Sans"', 'sans-serif'],
        app:     ['"Nunito"', 'sans-serif'],
      },
      colors: {
        brand: {
          'navy-900': '#0A2236',
          'navy-800': '#0F2E48',
          'blue-600': '#2E6CF6',
          'blue-700': '#2154CC',
          'blue-50':  '#EEF4FF',
          'sky-50':   '#F5F8FF',
          'gray-700': '#1F2937',
          'gray-500': '#6B7280',
          'lime-400': '#A3E635',
          'lime-300': '#BEF264',
          'green-600': '#65A30D',
          'green-700': '#3F6212',
          'green-50':  '#F0FDF4',
          'app-bg':    '#F8FAF7',
          'cream':    '#FAFAF8',
          'white':    '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
