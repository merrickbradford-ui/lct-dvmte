// Restaurant Finder App
// Uses Geolocation API and Leaflet.js to display nearby restaurants

class RestaurantFinder {
  constructor() {
    this.map = null;
    this.markers = [];
    this.restaurants = this.getMockRestaurants();
    this.currentLocation = null;
  }

  // Initialize the application
  init() {
    this.setupEventListeners();
    this.getCurrentLocation();
  }

  // Set up event listeners
  setupEventListeners() {
    const refreshBtn = document.getElementById('refresh-location');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.getCurrentLocation());
    }
  }

  // Get current location using Geolocation API
  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.showError('Geolocation is not supported by your browser.');
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

  // Initialize Leaflet map
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

    // Add user location marker
    L.marker([this.currentLocation.lat, this.currentLocation.lng])
      .addTo(this.map)
      .bindPopup('Your Location')
      .openPopup();

    // Add restaurant markers
    this.addRestaurantMarkers();
  }

  // Add restaurant markers to the map
  addRestaurantMarkers() {
    this.restaurants.forEach(restaurant => {
      const marker = L.marker([restaurant.lat, restaurant.lng])
        .addTo(this.map)
        .bindPopup(`
          <strong>${restaurant.name}</strong><br>
          ${restaurant.address}<br>
          Rating: ${restaurant.rating} ⭐<br>
          ${restaurant.cuisine}
        `);
      this.markers.push(marker);
    });
  }

  // Display restaurants in the list
  displayRestaurants() {
    this.hideLoading();
    
    const restaurantList = document.getElementById('restaurant-list');
    if (!restaurantList) return;

    restaurantList.innerHTML = '';

    this.restaurants.forEach(restaurant => {
      const distance = this.calculateDistance(
        this.currentLocation.lat,
        this.currentLocation.lng,
        restaurant.lat,
        restaurant.lng
      );

      const restaurantCard = document.createElement('article');
      restaurantCard.className = 'restaurant-card';
      restaurantCard.innerHTML = `
        <h3>${restaurant.name}</h3>
        <p class="address">${restaurant.address}</p>
        <p class="cuisine">${restaurant.cuisine}</p>
        <p class="rating">${restaurant.rating} ⭐</p>
        <p class="distance">${distance.toFixed(2)} km away</p>
      `;

      restaurantCard.addEventListener('click', () => {
        // Pan to restaurant on map
        this.map.setView([restaurant.lat, restaurant.lng], 15);
        // Open popup for the clicked restaurant
        this.markers[this.restaurants.indexOf(restaurant)].openPopup();
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

  // Get mock restaurant data
  getMockRestaurants() {
    // In a real app, this would come from an API
    return [
      {
        name: "Bella Italia",
        address: "123 Main St, Downtown",
        lat: 40.7128,
        lng: -74.0060,
        rating: 4.5,
        cuisine: "Italian"
      },
      {
        name: "Sushi Palace",
        address: "456 Oak Ave, Midtown",
        lat: 40.7589,
        lng: -73.9851,
        rating: 4.7,
        cuisine: "Japanese"
      },
      {
        name: "Burger Barn",
        address: "789 Elm St, Uptown",
        lat: 40.7831,
        lng: -73.9712,
        rating: 4.2,
        cuisine: "American"
      },
      {
        name: "Taco Fiesta",
        address: "321 Pine Rd, Westside",
        lat: 40.7282,
        lng: -73.9942,
        rating: 4.3,
        cuisine: "Mexican"
      },
      {
        name: "Curry House",
        address: "654 Maple Dr, Eastside",
        lat: 40.7505,
        lng: -73.9934,
        rating: 4.6,
        cuisine: "Indian"
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
      <p>${message}</p>
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
  const app = new RestaurantFinder();
  app.init();
});