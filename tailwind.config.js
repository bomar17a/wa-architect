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
                    surface: '#F8FAFC', // Near-white background
                    card: '#FFFFFF',    // Pure white cards
                    teal: '#2E6B6B',  // Deep Teal/Green
                    dark: '#1C1C1C',  // Dark Grey/Black
                    gold: '#FFC82C',  // Yellow/Gold
                    'teal-hover': '#245555',
                    'gold-hover': '#E5B21F',
                    highlight: '#3B82F6', // Sky blue — AI/interactive elements
                    danger: '#DC2626',    // Red — AdCom red flags
                    success: '#059669',   // Emerald — completed/final status

                    // Landing page canvas. Warm paper rather than the mint, which is now
                    // an accent band. `rule` is the hairline used under section eyebrows.
                    paper: '#FAF8F3',
                    'paper-deep': '#F2EEE5',
                    rule: '#E2DCCF',
                    ink: '#171717',
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
