// Initialize map centered on a default location (e.g., Beijing)
const map = L.map('map').setView([39.9042, 116.4074], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Mock trail data
const mockTrails = [
  { id: 1, name: '香山公园步道', difficulty: '简单', distance: '5 km', lat: 39.9833, lng: 116.2167 },
  { id: 2, name: '西山国家森林公园', difficulty: '中等', distance: '8 km', lat: 39.95, lng: 116.2 },
  { id: 3, name: '鹫峰国家森林公园', difficulty: '困难', distance: '12 km', lat: 40.0833, lng: 116.2 }
];

// Render trails
function renderTrails(trails) {
  const container = document.getElementById('trails-container');
  container.innerHTML = '';
  trails.forEach(trail => {
    const article = document.createElement('article');
    article.className = 'trail-card';
    article.innerHTML = `
      <h3>${trail.name}</h3>
      <p>难度: ${trail.difficulty} | 距离: ${trail.distance}</p>
    `;
    container.appendChild(article);

    // Add marker to map
    L.marker([trail.lat, trail.lng]).addTo(map)
      .bindPopup(`<b>${trail.name}</b><br>${trail.distance}, ${trail.difficulty}`);
  });
}

// Locate user
document.getElementById('locate-btn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('您的浏览器不支持定位功能。');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 13);
      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup('您的当前位置')
        .openPopup();
    },
    (error) => {
      console.error('Geolocation error:', error);
      alert('无法获取您的位置，请检查权限设置。');
    }
  );
});

// Initial render
renderTrails(mockTrails);