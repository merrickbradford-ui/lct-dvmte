// 全局变量
let map = null;
let markers = [];

// 初始化地图
function initMap(lat = 39.9042, lng = 116.4074) {
  if (map) {
    map.remove();
    markers.forEach(marker => marker.remove());
    markers = [];
  }

  map = L.map('trail-map').setView([lat, lng], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

// 模拟徒步路线数据（实际项目中应替换为真实 API）
function getMockTrails(lat, lng) {
  // 在真实坐标附近生成一些模拟路线
  const trails = [];
  const names = ['青山步道', '溪谷小径', '森林环线', '山顶观景道', '湖畔栈道'];
  const difficulties = ['简单', '中等', '困难'];
  const lengths = [2.5, 4.1, 6.8, 3.2, 5.0];

  for (let i = 0; i < 5; i++) {
    const offsetLat = (Math.random() - 0.5) * 0.05;
    const offsetLng = (Math.random() - 0.5) * 0.05;
    trails.push({
      id: i + 1,
      name: names[i],
      difficulty: difficulties[Math.floor(Math.random() * difficulties.length)],
      length: lengths[i],
      lat: lat + offsetLat,
      lng: lng + offsetLng,
      description: `这是一条风景优美的徒步路线，适合${difficulties[Math.floor(Math.random() * difficulties.length)]}级别的徒步者。`
    });
  }
  return trails;
}

// 显示路线列表
function displayTrails(trails) {
  const container = document.getElementById('trails-list');
  if (trails.length === 0) {
    container.innerHTML = '<div class="no-results">未找到徒步路线</div>';
    return;
  }

  container.innerHTML = trails.map(trail => `
    <article class="trail-card">
      <h3>${trail.name}</h3>
      <p>${trail.description}</p>
      <p><strong>难度:</strong> ${trail.difficulty} | <strong>长度:</strong> ${trail.length} 公里</p>
      <button onclick="centerMapOnTrail(${trail.lat}, ${trail.lng})">查看地图位置</button>
    </article>
  `).join('');
}

// 在地图上标记路线
function markTrailsOnMap(trails) {
  markers.forEach(marker => marker.remove());
  markers = [];

  trails.forEach(trail => {
    const marker = L.marker([trail.lat, trail.lng]).addTo(map)
      .bindPopup(`<b>${trail.name}</b><br>难度: ${trail.difficulty}<br>长度: ${trail.length} 公里`);
    markers.push(marker);
  });

  if (trails.length > 0) {
    const group = new L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

// 将地图中心移动到指定路线
function centerMapOnTrail(lat, lng) {
  map.setView([lat, lng], 14);
}

// 使用当前位置
async function useCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持地理位置功能');
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error('获取位置失败:', error);
        alert('无法获取您的位置，请手动输入地点');
        reject(error);
      },
      { timeout: 10000 }
    );
  });
}

// 地理编码：将地址转换为坐标（使用 Nominatim）
async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HikingTrailsWebApp/1.0 (contact@example.com)'
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    } else {
      throw new Error('未找到该地点');
    }
  } catch (error) {
    console.error('地理编码失败:', error);
    throw error;
  }
}

// 主搜索逻辑
async function handleSearch(locationInput) {
  let coords;
  try {
    if (locationInput.trim() === '') {
      // 如果没有输入，则尝试使用当前位置
      coords = await useCurrentLocation();
    } else {
      // 否则对输入的地址进行地理编码
      coords = await geocodeAddress(locationInput);
    }

    // 初始化地图
    initMap(coords.lat, coords.lng);

    // 获取并显示徒步路线（这里使用模拟数据）
    const trails = getMockTrails(coords.lat, coords.lng);
    displayTrails(trails);
    markTrailsOnMap(trails);
  } catch (error) {
    console.error('搜索失败:', error);
    document.getElementById('trails-list').innerHTML = 
      '<div class="no-results">搜索失败，请稍后重试</div>';
  }
}

// 事件监听
document.addEventListener('DOMContentLoaded', () => {
  // 初始化默认地图（北京）
  initMap();

  // 搜索表单提交
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('location-input').value;
    handleSearch(input);
  });

  // 使用当前位置按钮
  document.getElementById('use-current-location').addEventListener('click', () => {
    handleSearch('');
  });
});