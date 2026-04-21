/** @type {import('tailwindcss').Config} */
module.exports = {
  // src klasörü altındaki tüm sayfalarda Tailwind kullanabileceğiz
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sporthink: '#FF4500', // Sporthink'in marka rengini (örnek turuncu) buraya tanımlıyoruz
        darkBg: '#121212',
        cardBg: '#1E1E1E'
      }
    },
  },
  plugins: [],
}