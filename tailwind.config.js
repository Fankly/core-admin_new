module.exports = {
  prefix: 'tw-',
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false
  },
  theme: {
    extend: {
      colors: {
        sggreen: {
          50: '#e6f4ea',
          100: '#c2e7cc',
          200: '#99d9aa',
          500: '#008b53',
          600: '#007b49',
          700: '#006a3f',
          800: '#005e37'
        },
        background: 'oklch(from var(--background) l c h / <alpha-value>)',
        foreground: 'oklch(from var(--foreground) l c h / <alpha-value>)',
        card: {
          DEFAULT: 'oklch(from var(--card) l c h / <alpha-value>)',
          foreground: 'oklch(from var(--card-foreground) l c h / <alpha-value>)'
        },
        popover: {
          DEFAULT: 'oklch(from var(--popover) l c h / <alpha-value>)',
          foreground: 'oklch(from var(--popover-foreground) l c h / <alpha-value>)'
        },
        primary: {
          DEFAULT: 'oklch(from var(--primary) l c h / <alpha-value>)',
          foreground: 'oklch(from var(--primary-foreground) l c h / <alpha-value>)'
        },
        secondary: {
          DEFAULT: 'oklch(from var(--secondary) l c h / <alpha-value>)',
          foreground: 'oklch(from var(--secondary-foreground) l c h / <alpha-value>)'
        },
        muted: {
          DEFAULT: 'oklch(from var(--muted) l c h / <alpha-value>)',
          foreground: 'oklch(from var(--muted-foreground) l c h / <alpha-value>)'
        },
        accent: {
          DEFAULT: 'oklch(from var(--accent) l c h / <alpha-value>)',
          foreground: 'oklch(from var(--accent-foreground) l c h / <alpha-value>)'
        },
        destructive: {
          DEFAULT: 'oklch(from var(--destructive) l c h / <alpha-value>)',
          foreground: 'oklch(from var(--destructive-foreground) l c h / <alpha-value>)'
        },
        border: 'oklch(from var(--border) l c h / <alpha-value>)',
        input: 'oklch(from var(--input) l c h / <alpha-value>)',
        ring: 'oklch(from var(--ring) l c h / <alpha-value>)',
        status: {
          success: 'oklch(from var(--status-success) l c h / <alpha-value>)',
          warning: 'oklch(from var(--status-warning) l c h / <alpha-value>)',
          error: 'oklch(from var(--status-error) l c h / <alpha-value>)',
          info: 'oklch(from var(--status-info) l c h / <alpha-value>)'
        },
        success: 'oklch(from var(--status-success) l c h / <alpha-value>)',
        warning: 'oklch(from var(--status-warning) l c h / <alpha-value>)',
        error: 'oklch(from var(--status-error) l c h / <alpha-value>)',
        info: 'oklch(from var(--status-info) l c h / <alpha-value>)'
      },
      spacing: {
        4.5: '1.125rem',
        5.5: '1.375rem'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      scale: {
        98: '.98'
      }
    }
  },
  plugins: []
}
