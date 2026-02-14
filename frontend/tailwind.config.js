/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'eco-green': '#10b981',
                'dark-bg': '#0f172a',
                'card-bg': '#1e293b',
            },
        },
    },
    plugins: [],
}
