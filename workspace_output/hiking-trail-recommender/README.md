# TrailFinder - Hiking Trail Recommender

A simple, responsive web application that recommends nearby hiking trails based on your current location.

## Features

- Uses browser geolocation to find your current position
- Displays an interactive map using Leaflet.js and OpenStreetMap
- Shows a list of nearby hiking trails with details (distance, difficulty, elevation)
- Fully responsive design that works on mobile and desktop

## Technologies Used

- HTML5, CSS3, JavaScript (vanilla)
- Leaflet.js for interactive maps
- OpenStreetMap for map tiles
- CSS Grid and Flexbox for layout
- Semantic HTML5 elements

## How to Use

1. Open `index.html` in a modern web browser
2. Click the "Find Trails Near Me" button
3. Allow location access when prompted
4. View nearby trails on the map and in the list below

## Notes

- This is a frontend-only demo. In a production app, you would connect to a hiking trail API (like AllTrails, Hiking Project, or OpenTrailData) to fetch real trail data based on coordinates.
- The sample trail data is randomly positioned near your location for demonstration purposes.
- The app uses Dark Slate Gray (`#2F4F4F`) as the primary color as per design guidelines.

## Browser Requirements

- Modern browser with Geolocation API support (Chrome, Firefox, Safari, Edge)
- Internet connection (to load Leaflet.js and OpenStreetMap tiles)

## License

MIT License