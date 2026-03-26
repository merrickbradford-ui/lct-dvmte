# Nearby Hiking Trails Website

A responsive website that displays hiking trails near the user's location using Leaflet.js and OpenStreetMap.

## Features

- Interactive map showing hiking trail locations
- List of available trails with details (difficulty, distance, elevation)
- Geolocation functionality to find user's current position
- Responsive design that works on mobile and desktop

## Technologies Used

- HTML5 with semantic elements
- CSS3 with custom properties and responsive design
- JavaScript (ES6+)
- Leaflet.js for interactive maps
- OpenStreetMap for map tiles

## Setup

1. Clone this repository
2. Open `index.html` in a web browser
3. Click "Find My Location" to center the map on your current position

## File Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling with CSS variables and responsive design
- `script.js` - JavaScript functionality for maps and trails

## Customization

To add more trails, modify the `trails` array in `script.js` with the following format:

```javascript
{
    id: 4,
    name: "Trail Name",
    difficulty: "Easy/Moderate/Hard",
    distance: "X.X miles",
    elevation: "X ft",
    description: "Trail description",
    coordinates: [latitude, longitude]
}
```

## Notes

- This is a frontend-only implementation
- For production use, consider connecting to a hiking trails API instead of hardcoded data
- The site uses Dark Slate Gray (`#2F4F4F`) as the primary color as per design guidelines