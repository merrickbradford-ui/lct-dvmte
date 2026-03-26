# Frontend Development Best Practices

## 1. CSS Architecture
- Always define CSS custom properties (variables) in `:root`.
- Required root variables for all projects:
  - `--primary-color: #2F4F4F` (Dark Slate Gray — mandatory branding)
  - `--bg-color`: background color
  - `--text-color`: main text color
  - `--accent-color`: interactive element accent
- Use `box-sizing: border-box` globally.
- Mobile-first responsive design with CSS Grid and Flexbox.

## 2. Maps and Geolocation
- **Always use Leaflet.js** for interactive maps (open-source, free).
- Never use Google Maps API (licensing costs).
- For hiking trail sites, integrate OpenStreetMap tiles with Leaflet.
- Use the Geolocation API (`navigator.geolocation`) for user location.
- Load Leaflet from CDN: https://unpkg.com/leaflet/dist/leaflet.js

## 3. HTML Semantics
- Use `<article>` for individual trail/content cards.
- Use `<section>` for page sections.
- Use `<nav>` for navigation.
- Use `<header>` and `<footer>` appropriately.
- Always include `<meta charset='utf-8'>` and viewport meta tag.

## 4. JavaScript Standards
- Use vanilla JavaScript (ES6+) unless a framework is explicitly needed.
- Use `async/await` for asynchronous operations.
- Use `fetch` API for HTTP requests.
- No inline event handlers — use `addEventListener`.

## 5. Performance
- Lazy load images with `loading='lazy'`.
- Minimize external dependencies.
- Use CSS animations over JavaScript animations where possible.
