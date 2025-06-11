/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Enable dark mode using the class strategy
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Paths to all component files
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        'text-primary': 'var(--color-text-primary)',
        'primary-accent': 'var(--color-primary-accent)',
        'secondary-accent': 'var(--color-secondary-accent)',
        'card-background': 'var(--color-card-background)',
        'border-color': 'var(--color-border-color)',
        // Add more custom semantic color names as needed
      },
      backgroundColor: theme => ({
        ...theme('colors'), // Inherit existing colors
        default: 'var(--color-background)',
        card: 'var(--color-card-background)',
        accent: 'var(--color-primary-accent)',
      }),
      textColor: theme => ({
        ...theme('colors'),
        default: 'var(--color-text-primary)',
        primary: 'var(--color-text-primary)',
        accent: 'var(--color-primary-accent)',
        secondary: 'var(--color-secondary-accent)',
      }),
      borderColor: theme => ({
        ...theme('colors'),
        default: 'var(--color-border-color)',
        accent: 'var(--color-primary-accent)',
      }),
    },
  },
  plugins: [],
}
