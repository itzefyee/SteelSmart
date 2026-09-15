/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // These aliases retain the original visible palette while supporting
        // the semantic utility names used by existing form controls.
        primary: 'hsl(var(--primary) / <alpha-value>)',
        'primary-light': '#3399FF',
        secondary: 'hsl(var(--secondary) / <alpha-value>)',
        'secondary-foreground': 'hsl(var(--secondary-foreground) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-light': '#66E0FF',
        'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
        popover: 'hsl(var(--popover) / <alpha-value>)',
        'popover-foreground': 'hsl(var(--popover-foreground) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
        destructive: 'hsl(var(--destructive) / <alpha-value>)',
        'destructive-foreground': 'hsl(var(--destructive-foreground) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        text: 'hsl(var(--foreground) / <alpha-value>)',
        'text-secondary': 'hsl(var(--muted-foreground) / <alpha-value>)',
        success: 'hsl(var(--success) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        error: 'hsl(var(--destructive) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
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
