module.exports = {
  plugins: [
    // Use the dedicated PostCSS entrypoint for Tailwind
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
}
