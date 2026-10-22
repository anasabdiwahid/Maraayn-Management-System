/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: 'rgb(var(--brand-navy, 20 39 70) / <alpha-value>)',
          'navy-dark': 'rgb(var(--brand-navy, 20 39 70) / <alpha-value>)',
          'navy-light': 'rgb(var(--brand-navy, 20 39 70) / <alpha-value>)',
          amber: 'rgb(var(--brand-amber, 230 174 67) / <alpha-value>)',
          'amber-light': 'rgb(var(--brand-amber, 230 174 67) / <alpha-value>)',
          'amber-dark': 'rgb(var(--brand-amber, 230 174 67) / <alpha-value>)',
          pink: '#E11D8A',
          bg: '#F5F7FB',
          card: '#FFFFFF',
          text: '#1E293B',
          muted: '#64748B',
          border: '#E2E8F0',
          success: '#16A34A',
          danger: '#DC2626',
          warning: '#F59E0B',
          info: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'brand': '0 4px 20px -2px rgba(20, 39, 70, 0.08)',
        'brand-lg': '0 10px 30px -4px rgba(20, 39, 70, 0.12)',
        'amber-glow': '0 0 20px rgba(230, 174, 67, 0.3)',
      }
    },
  },
  plugins: [],
}

