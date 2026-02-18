/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    white: '#ffffff',
                    light: '#EBF5F5', // Light Mint/Cyan
                    teal: '#2E6B6B',  // Deep Teal/Green
                    dark: '#1C1C1C',  // Dark Grey/Black
                    gold: '#FFC82C',  // Yellow/Gold
                    'teal-hover': '#245555',
                    'gold-hover': '#E5B21F',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Lora', 'serif'],
            }
        },
    },
    plugins: [],
}
