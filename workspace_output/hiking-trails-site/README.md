# Nearby Hiking Trails Website

A responsive website that displays hiking trails near the user's location using Leaflet.js and OpenStreetMap.

## Features

- Interactive map using Leaflet.js
- Geolocation support to find user's current location
- Responsive design that works on mobile and desktop
- Sample trail data displayed in a list format
- Dark Slate Gray (`#2F4F4F`) as the primary color theme

## Technologies Used

- HTML5
- CSS3 with custom properties (variables)
- Vanilla JavaScript (ES6+)
- Leaflet.js for interactive maps
- OpenStreetMap for map tiles

## How to Use

1. Open `index.html` in any modern web browser
2. Click the "Find My Location" button to center the map on your current location
3. Browse the list of hiking trails on the right side
4. Click "View on Map" to center the map on a specific trail
5. Click on map markers to see trail information

## Project Structure

```
hiking-trails-site/
├── index.html          # Main HTML file with embedded CSS and JavaScript
└── README.md           # This file
```

## Notes

- This is a frontend-only implementation with sample data
- In a production environment, you would connect to a backend API to fetch real trail data
- The site follows semantic HTML5 standards with proper use of `<article>`, `<section>`, etc.
- Mobile-first responsive design ensures good experience on all devices

## License

This project is open source and available under the MIT License.