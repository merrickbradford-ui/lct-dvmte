// 初始化地图，默认中心点为北京
const map = L.map('map').setView([39.9042, 116.4074], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let userMarker = null;

document.getElementById('locate-btn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('您的浏览器不支持地理定位。');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      map.setView([latitude, longitude], 14);

      if (userMarker) {
        map.removeLayer(userMarker);
      }
      userMarker = L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup('您当前位置')
        .openPopup();

      // 模拟加载附近路线（实际项目中应调用 API）
      loadNearbyTrails(latitude, longitude);
    },
    (error) => {
      console.error('Geolocation error:', error);
      alert('无法获取您的位置，请检查权限或稍后重试。');
    }
  );
});

function loadNearbyTrails(lat, lng) {
  const trailsContainer = document.getElementById('trails-container');
  trailsContainer.innerHTML = '';

  // 模拟数据：实际应通过 fetch 调用后端 API
  const mockTrails = [
    { id: 1, name: '香山徒步路线', distance: '5.2 km', difficulty: '中等' },
    { id: 2, name: '百望山环线', distance: '3.8 km', difficulty: '简单' },
    { id: 3, name: '鹫峰国家森林公园', distance: '7.1 km', difficulty: '困难' }
  ];

  mockTrails.forEach(trail => {
    const card = document.createElement('article');
    card.className = 'trail-card';
    card.innerHTML = `
      <h3>${trail.name}</h3>
      <p>距离：${trail.distance}</p>
      <p>难度：${trail.difficulty}</p>
    `;
    trailsContainer.appendChild(card);
  });
}