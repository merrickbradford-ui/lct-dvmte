// Sample trail data - in a real app, this would come from an API
const trails = [
    {
        id: 1,
        name: "Mountain Ridge Trail",
        difficulty: "Moderate",
        distance: "5.2 miles",
        elevation: "1,200 ft",
        description: "Scenic ridge trail with panoramic views of the valley.",
        coordinates: [40.7128, -74.0060]
    },
    {
        id: 2,
        name: "Forest Creek Loop",
        difficulty: "Easy",
        distance: "3.1 miles",
        elevation: "450 ft",
        description: "Peaceful loop through dense forest alongside a gentle creek.",
        coordinates: [40.7589, -73.9851]
    },
    {
        id: 3,
        name: "Summit Challenge",
        difficulty: "Hard",
        distance: "8.7 miles",
        elevation: "2,800 ft",
        description: "Strenuous climb to the highest peak in the region.",
        coordinates: [40.6892, -74.0445]
    }
];

let map;
let userMarker;

// Initialize the map
function initMap(center = [40.7128, -74.0060]) {
    if (map) {
        map.remove();
    }
    
    map = L.map('trailMap').setView(center, 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Add trail markers
    trails.forEach(trail => {
        const marker = L.marker(trail.coordinates).addTo(map);
        marker.bindPopup(`
            <strong>${trail.name}</strong><br>
            Difficulty: ${trail.difficulty}<br>
            Distance: ${trail.distance}<br>
            Elevation: ${trail.elevation}
        `);
    });
}

// Get user's current location
function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userCoords = [position.coords.latitude, position.coords.longitude];
            
            // Remove existing user marker if any
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            
            // Add user marker
            userMarker = L.marker(userCoords, {
                icon: L.divIcon({
                    className: 'user-location-icon',
                    html: '<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map);
            
            // Center map on user location
            map.setView(userCoords, 13);
        },
        (error) => {
            console.error("Error getting location:", error);
            alert("Unable to retrieve your location. Please ensure location services are enabled.");
        }
    );
}

// Render trails list
function renderTrailsList() {
    const container = document.getElementById('trailsContainer');
    container.innerHTML = '';
    
    trails.forEach(trail => {
        const article = document.createElement('article');
        article.innerHTML = `
            <h3>${trail.name}</h3>
            <p><strong>Difficulty:</strong> ${trail.difficulty}</p>
            <p><strong>Distance:</strong> ${trail.distance}</p>
            <p><strong>Elevation Gain:</strong> ${trail.elevation}</p>
            <p>${trail.description}</p>
            <button onclick="centerMapOnTrail(${trail.id})">View on Map</button>
        `;
        container.appendChild(article);
    });
}

// Center map on specific trail
function centerMapOnTrail(trailId) {
    const trail = trails.find(t => t.id === trailId);
    if (trail) {
        map.setView(trail.coordinates, 14);
        // Open popup for the trail
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                const latLng = layer.getLatLng();
                if (latLng.lat === trail.coordinates[0] && latLng.lng === trail.coordinates[1]) {
                    layer.openPopup();
                }
            }
        });
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    renderTrailsList();
    
    // Set up event listener for locate button
    document.getElementById('locateBtn').addEventListener('click', getUserLocation);
});