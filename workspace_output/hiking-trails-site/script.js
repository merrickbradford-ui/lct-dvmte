// Initialize the map centered at a default location
const map = L.map('map').setView([37.7749, -122.4194], 10);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Sample trail data (in a real app, this would come from an API)
const sampleTrails = [
    {
        id: 1,
        name: "Golden Gate Park Trail",
        difficulty: "Easy",
        distance: "2.5 miles",
        elevation: "150 ft",
        description: "A scenic walk through San Francisco's famous park.",
        lat: 37.7694,
        lng: -122.4862
    },
    {
        id: 2,
        name: "Mount Tamalpais Summit",
        difficulty: "Hard",
        distance: "6.2 miles",
        elevation: "2,200 ft",
        description: "Challenging hike with panoramic views of the Bay Area.",
        lat: 37.9274,
        lng: -122.6028
    },
    {
        id: 3,
        name: "Muir Woods Loop",
        difficulty: "Moderate",
        distance: "3.8 miles",
        elevation: "800 ft",
        description: "Beautiful redwood forest trail with creek crossings.",
        lat: 37.8917,
        lng: -122.5672
    }
];

// Function to add markers for trails
function addTrailMarkers() {
    sampleTrails.forEach(trail => {
        const marker = L.marker([trail.lat, trail.lng]).addTo(map);
        marker.bindPopup(`<b>${trail.name}</b><br>${trail.description}`);
    });
}

// Function to display trails in the list
function displayTrails() {
    const container = document.getElementById('trails-container');
    container.innerHTML = '';
    
    sampleTrails.forEach(trail => {
        const article = document.createElement('article');
        article.className = 'trail-card';
        article.innerHTML = `
            <h3>${trail.name}</h3>
            <p>${trail.description}</p>
            <p><strong>Difficulty:</strong> ${trail.difficulty}</p>
            <p><strong>Distance:</strong> ${trail.distance}</p>
            <p><strong>Elevation Gain:</strong> ${trail.elevation}</p>
        `;
        container.appendChild(article);
    });
}

// Function to handle user location
function findMyLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Add user location marker
                L.marker([userLat, userLng])
                    .addTo(map)
                    .bindPopup('Your Location')
                    .openPopup();
                
                // Center map on user
                map.setView([userLat, userLng], 12);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please ensure location services are enabled.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    addTrailMarkers();
    displayTrails();
    
    // Set up event listener for locate button
    document.getElementById('locate-btn').addEventListener('click', findMyLocation);
});