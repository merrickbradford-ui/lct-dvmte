// Sample trail data (in a real app, this would come from an API)
const sampleTrails = [
    {
        id: 1,
        name: "Pine Ridge Trail",
        distance: "5.2 km",
        difficulty: "Moderate",
        elevation: "+320 m",
        description: "Scenic forest path with panoramic mountain views.",
        lat: 37.7749,
        lng: -122.4194
    },
    {
        id: 2,
        name: "Eagle Peak Loop",
        distance: "8.7 km",
        difficulty: "Hard",
        elevation: "+650 m",
        description: "Challenging climb with rewarding summit vistas.",
        lat: 37.7849,
        lng: -122.4294
    },
    {
        id: 3,
        name: "Willow Creek Path",
        distance: "3.1 km",
        difficulty: "Easy",
        elevation: "+80 m",
        description: "Gentle riverside walk perfect for families.",
        lat: 37.7649,
        lng: -122.4094
    }
];

let map;
let userMarker;
let trailMarkers = [];

// Initialize the map centered on a default location
function initMap(lat = 37.7749, lng = -122.4194) {
    if (map) {
        map.remove();
        trailMarkers.forEach(marker => marker.remove());
        trailMarkers = [];
    }

    map = L.map('trail-map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add user marker if coordinates are provided
    if (userMarker) {
        userMarker.remove();
    }
    userMarker = L.marker([lat, lng], {
        title: "Your Location"
    }).addTo(map);
}

// Display trails on the map and in the list
function displayTrails(trails, userLat, userLng) {
    // Clear previous markers
    trailMarkers.forEach(marker => marker.remove());
    trailMarkers = [];

    // Update trails list
    const trailsCardsContainer = document.getElementById('trails-cards');
    trailsCardsContainer.innerHTML = '';

    trails.forEach(trail => {
        // Add marker to map
        const trailMarker = L.marker([trail.lat, trail.lng], {
            title: trail.name
        }).addTo(map);
        trailMarkers.push(trailMarker);

        // Create trail card
        const card = document.createElement('article');
        card.className = 'trail-card';
        card.innerHTML = `
            <h3>${trail.name}</h3>
            <div class="trail-info">
                <p><strong>Distance:</strong> ${trail.distance}</p>
                <p><strong>Difficulty:</strong> ${trail.difficulty}</p>
                <p><strong>Elevation Gain:</strong> ${trail.elevation}</p>
                <p>${trail.description}</p>
            </div>
        `;
        trailsCardsContainer.appendChild(card);
    });

    // Adjust map view to show all markers
    if (trails.length > 0) {
        const group = new L.featureGroup([userMarker, ...trailMarkers]);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// Handle location finding
document.getElementById('locate-btn').addEventListener('click', () => {
    const statusDiv = document.getElementById('location-status');
    statusDiv.textContent = 'Locating you...';

    if (!navigator.geolocation) {
        statusDiv.textContent = 'Geolocation is not supported by your browser.';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            statusDiv.textContent = `Located! Finding trails near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            
            // Initialize map with user's location
            initMap(latitude, longitude);
            
            // In a real app, you would fetch trails from an API based on coordinates
            // For this demo, we'll use sample data with adjusted coordinates
            const nearbyTrails = sampleTrails.map(trail => ({
                ...trail,
                // Adjust trail coordinates to be near the user (for demo purposes)
                lat: latitude + (Math.random() - 0.5) * 0.02,
                lng: longitude + (Math.random() - 0.5) * 0.02
            }));
            
            displayTrails(nearbyTrails, latitude, longitude);
        },
        (error) => {
            console.error('Geolocation error:', error);
            let message = 'Unable to get your location.';
            if (error.code === 1) {
                message = 'Please allow location access to find nearby trails.';
            }
            statusDiv.textContent = message;
        }
    );
});

// Initialize map on page load
initMap();