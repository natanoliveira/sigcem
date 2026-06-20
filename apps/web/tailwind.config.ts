import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

function hsl(v: string) {
  return `hsl(var(${v}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'var(--font-sans)', ...fontFamily.sans],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        background:  hsl('--background'),
        foreground:  hsl('--foreground'),
        card: {
          DEFAULT:    hsl('--card'),
          foreground: hsl('--card-foreground'),
        },
        popover: {
          DEFAULT:    hsl('--popover'),
          foreground: hsl('--popover-foreground'),
        },
        primary: {
          DEFAULT:    hsl('--primary'),
          foreground: hsl('--primary-foreground'),
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#5046e4',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        secondary: {
          DEFAULT:    hsl('--secondary'),
          foreground: hsl('--secondary-foreground'),
        },
        muted: {
          DEFAULT:    hsl('--muted'),
          foreground: hsl('--muted-foreground'),
        },
        accent: {
          DEFAULT:    hsl('--accent'),
          foreground: hsl('--accent-foreground'),
        },
        destructive: {
          DEFAULT:    hsl('--destructive'),
          foreground: hsl('--destructive-foreground'),
        },
        border: hsl('--border'),
        input:  hsl('--input'),
        ring:   hsl('--ring'),
        chart: {
          '1': hsl('--chart-1'),
          '2': hsl('--chart-2'),
          '3': hsl('--chart-3'),
          '4': hsl('--chart-4'),
          '5': hsl('--chart-5'),
        },
        sidebar: {
          DEFAULT:    hsl('--sidebar'),
          foreground: hsl('--sidebar-foreground'),
          primary: {
            DEFAULT:    hsl('--sidebar-primary'),
            foreground: hsl('--sidebar-primary-foreground'),
          },
          accent: {
            DEFAULT:    hsl('--sidebar-accent'),
            foreground: hsl('--sidebar-accent-foreground'),
          },
          border: hsl('--sidebar-border'),
          ring:   hsl('--sidebar-ring'),
        },
        neutral: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
