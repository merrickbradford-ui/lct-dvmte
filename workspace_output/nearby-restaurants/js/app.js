// Nearby Restaurants Finder Application
// Uses Geolocation API and Leaflet.js to display restaurants near user's location

class NearbyRestaurantsApp {
  constructor() {
    this.map = null;
    this.markers = [];
    this.restaurants = this.getMockRestaurants();
    this.currentLocation = null;
  }

  // Initialize the application when DOM is ready
  init() {
    this.setupEventListeners();
    this.getCurrentLocation();
  }

  // Set up event listeners for UI elements
  setupEventListeners() {
    const refreshBtn = document.getElementById('refresh-location');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.getCurrentLocation());
    }
  }

  // Get current location using browser's Geolocation API
  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showError('Geolocation is not supported by your browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      return;
    }

    this.showLoading();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.currentLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        this.initializeMap();
        this.displayRestaurants();
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.hideLoading();
        let errorMessage = 'Unable to get your location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access to use this feature.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'The request to get your location timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
        }
        this.showError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  // Initialize Leaflet map centered on user's location
  initializeMap() {
    // Clear existing map if any
    if (this.map) {
      this.map.remove();
      this.markers = [];
    }

    // Create new map centered on current location
    this.map = L.map('map').setView([this.currentLocation.lat, this.currentLocation.lng], 14);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Add user location marker with custom icon
    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: '<div style="background-color: var(--primary-color); width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    L.marker([this.currentLocation.lat, this.currentLocation.lng], { icon: userIcon })
      .addTo(this.map)
      .bindPopup('<strong>Your Location</strong>')
      .openPopup();

    // Add restaurant markers
    this.addRestaurantMarkers();
  }

  // Add restaurant markers to the map
  addRestaurantMarkers() {
    this.restaurants.forEach((restaurant, index) => {
      // Create custom marker icon based on rating
      const ratingColor = restaurant.rating >= 4.5 ? '#4CAF50' : 
                         restaurant.rating >= 4.0 ? '#FF9800' : '#F44336';
      
      const restaurantIcon = L.divIcon({
        className: 'restaurant-marker',
        html: `<div style="background-color: ${ratingColor}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
          ${Math.round(restaurant.rating)}
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([restaurant.lat, restaurant.lng], { icon: restaurantIcon })
        .addTo(this.map)
        .bindPopup(`
          <div style="min-width: 200px;">
            <h4 style="color: var(--primary-color); margin-bottom: 5px;">${restaurant.name}</h4>
            <p><strong>Address:</strong> ${restaurant.address}</p>
            <p><strong>Cuisine:</strong> ${restaurant.cuisine}</p>
            <p><strong>Rating:</strong> <span style="color: var(--accent-color); font-weight: bold;">${restaurant.rating} ⭐</span></p>
            <p><strong>Distance:</strong> ${this.calculateDistance(
              this.currentLocation.lat,
              this.currentLocation.lng,
              restaurant.lat,
              restaurant.lng
            ).toFixed(2)} km</p>
          </div>
        `);
      
      // Add click event to highlight corresponding restaurant card
      marker.on('click', () => {
        this.highlightRestaurantCard(index);
      });
      
      this.markers.push(marker);
    });
  }

  // Highlight restaurant card when marker is clicked
  highlightRestaurantCard(index) {
    const cards = document.querySelectorAll('.restaurant-card');
    cards.forEach((card, i) => {
      if (i === index) {
        card.style.borderColor = '#2F4F4F';
        card.style.boxShadow = '0 0 15px rgba(47, 79, 79, 0.3)';
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        card.style.borderColor = '';
        card.style.boxShadow = '';
      }
    });
  }

  // Display restaurants in the list with distance calculations
  displayRestaurants() {
    this.hideLoading();
    
    const restaurantList = document.getElementById('restaurant-list');
    if (!restaurantList) return;

    // Sort restaurants by distance
    const sortedRestaurants = this.restaurants
      .map((restaurant, index) => ({
        ...restaurant,
        distance: this.calculateDistance(
          this.currentLocation.lat,
          this.currentLocation.lng,
          restaurant.lat,
          restaurant.lng
        ),
        originalIndex: index
      }))
      .sort((a, b) => a.distance - b.distance);

    restaurantList.innerHTML = '';

    sortedRestaurants.forEach((restaurant) => {
      const restaurantCard = document.createElement('article');
      restaurantCard.className = 'restaurant-card';
      restaurantCard.innerHTML = `
        <h3>${restaurant.name}</h3>
        <p class="address">${restaurant.address}</p>
        <p class="cuisine">${restaurant.cuisine}</p>
        <p class="rating">${restaurant.rating} ⭐</p>
        <p class="distance">${restaurant.distance.toFixed(2)} km away</p>
      `;

      // Add click event to pan to restaurant on map
      restaurantCard.addEventListener('click', () => {
        this.map.setView([restaurant.lat, restaurant.lng], 15);
        this.markers[restaurant.originalIndex].openPopup();
        this.highlightRestaurantCard(restaurant.originalIndex);
      });

      restaurantList.appendChild(restaurantCard);
    });
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Convert degrees to radians
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get mock restaurant data (in a real app, this would come from an API)
  getMockRestaurants() {
    // Generate restaurants around the user's general area
    // Using coordinates around New York City as an example
    return [
      {
        name: "Bella Italia",
        address: "123 Main Street, Downtown",
        lat: 40.7128,
        lng: -74.0060,
        rating: 4.7,
        cuisine: "Italian"
      },
      {
        name: "Sushi Palace",
        address: "456 Oak Avenue, Midtown",
        lat: 40.7589,
        lng: -73.9851,
        rating: 4.8,
        cuisine: "Japanese"
      },
      {
        name: "Burger Barn",
        address: "789 Elm Street, Uptown",
        lat: 40.7831,
        lng: -73.9712,
        rating: 4.3,
        cuisine: "American"
      },
      {
        name: "Taco Fiesta",
        address: "321 Pine Road, Westside",
        lat: 40.7282,
        lng: -73.9942,
        rating: 4.5,
        cuisine: "Mexican"
      },
      {
        name: "Curry House",
        address: "654 Maple Drive, Eastside",
        lat: 40.7505,
        lng: -73.9934,
        rating: 4.6,
        cuisine: "Indian"
      },
      {
        name: "Le Petit Bistro",
        address: "987 Cedar Lane, Financial District",
        lat: 40.7074,
        lng: -74.0113,
        rating: 4.9,
        cuisine: "French"
      },
      {
        name: "Mediterranean Delight",
        address: "246 Birch Boulevard, SoHo",
        lat: 40.7245,
        lng: -74.0018,
        rating: 4.4,
        cuisine: "Mediterranean"
      }
    ];
  }

  // Show loading state
  showLoading() {
    const mapContainer = document.getElementById('map');
    const restaurantList = document.getElementById('restaurant-list');
    
    if (mapContainer) {
      mapContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    }
    
    if (restaurantList) {
      restaurantList.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    }
  }

  // Hide loading state
  hideLoading() {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => el.remove());
  }

  // Show error message
  showError(message) {
    const mapContainer = document.getElementById('map');
    const restaurantList = document.getElementById('restaurant-list');
    
    const errorHtml = `<div class="no-location">
      <div class="error-message">${message}</div>
      <button id="refresh-location">Try Again</button>
    </div>`;
    
    if (mapContainer) {
      mapContainer.innerHTML = errorHtml;
    }
    
    if (restaurantList) {
      restaurantList.innerHTML = errorHtml;
    }
    
    // Re-setup event listeners for the new button
    this.setupEventListeners();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new NearbyRestaurantsApp();
  app.init();
});