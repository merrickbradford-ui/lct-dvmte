# Nearby Restaurants Finder

A web application that displays restaurants near your current location using geolocation and interactive maps.

## Features

- Automatically detects your current location using browser geolocation
- Displays nearby restaurants on an interactive map using Leaflet.js
- Shows restaurant details including name, address, cuisine type, rating, and distance
- Responsive design that works on both desktop and mobile devices
- Interactive elements - click on map markers or restaurant cards to see details

## Technologies Used

- **HTML5** - Semantic markup structure
- **CSS3** - Custom properties, Grid/Flexbox layout
- **JavaScript (ES6+)** - Vanilla JS with modern syntax
- **Leaflet.js** - Open-source interactive maps
- **OpenStreetMap** - Free map tiles

## How to Use

1. Open `index.html` in your web browser
2. When prompted, allow the website to access your location
3. The app will automatically load restaurants near your current position
4. Explore restaurants on the map or browse the list on the right
5. Click on any restaurant marker or card to view detailed information

## Browser Requirements

- Modern browser with Geolocation API support (Chrome, Firefox, Safari, Edge)
- Internet connection for loading map tiles

## Project Structure

```
nearby-restaurants/
├── index.html          # Main HTML file
├── css/style.css       # Stylesheet with CSS variables
├── js/app.js           # Main JavaScript application logic
└── README.md           # This documentation file
```

## Development Notes

- Uses mock restaurant data (in a real application, this would connect to a restaurant API)
- Implements Haversine formula for accurate distance calculations
- Follows accessibility best practices with semantic HTML
- Mobile-first responsive design approach

## License

MIT License