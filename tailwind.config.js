/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0066CC',
        'primary-light': '#3399FF',
        secondary: '#6B46C1',
        accent: '#00D4FF',
        'accent-light': '#66E0FF',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      aspectRatio: {
        'w-16': '16',
        'h-12': '12',
        'w-1': '1',
        'h-1': '1',
      },
      backgroundImage: {
        'blueprint-grid': 'radial-gradient(circle, rgba(0, 102, 204, 0.05) 1px, transparent 1px)',
        'gradient-blue': 'linear-gradient(135deg, #0066CC, #00D4FF)',
        'gradient-purple': 'linear-gradient(135deg, #6B46C1, #9B7FD9)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      boxShadow: {
        'blue-glow': '0 4px 12px rgba(0, 102, 204, 0.25)',
        'blue-glow-lg': '0 12px 24px rgba(0, 102, 204, 0.3)',
      },
    },
  },
  plugins: [],
}