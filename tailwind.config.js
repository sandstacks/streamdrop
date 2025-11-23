/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#020617', // slate-950
        surface: '#020817', // deep navy similar to Streamflow
        surfaceAlt: '#02091f',
        accent: {
          DEFAULT: '#6366f1', // indigo-500
          soft: '#4f46e5',
        },
      },
      boxShadow: {
        'soft-xl': '0 24px 60px rgba(15,23,42,0.85)',
      },
    },
  },
  plugins: [],
}


