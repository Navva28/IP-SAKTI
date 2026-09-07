/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ayurveda: {
          50: '#f0f7f5',
          100: '#daede7',
          200: '#b8dcd1',
          300: '#8cc2b4',
          400: '#62a394',
          500: '#478779',
          600: '#346b60',
          700: '#0F5257', // Primary Deep Green
          800: '#254742',
          900: '#223c38',
          950: '#102220',
        },
        gold: {
          50: '#fdfbf2',
          100: '#fbf4df',
          200: '#f5e6b7',
          300: '#edd285',
          400: '#e4b953',
          500: '#D4AF37', // Accent Gold
          600: '#b78b27',
          700: '#926622',
          800: '#795023',
          900: '#674222',
          950: '#3b2210',
        }
      },
    },
  },
  plugins: [],
}
