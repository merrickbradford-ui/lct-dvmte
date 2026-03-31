// 模拟的徒步路线数据（实际项目中可替换为真实 API）
const mockTrails = [
  {
    id: 1,
    name: "西湖群山徒步路线",
    location: "杭州",
    region: "华东",
    difficulty: "中等",
    distance: "12公里",
    description: "环绕西湖周边山丘的经典徒步路线，风景优美。",
    coordinates: [30.2741, 120.1551]
  },
  {
    id: 2,
    name: "香山红叶步道",
    location: "北京",
    region: "华北",
    difficulty: "简单",
    distance: "5公里",
    description: "秋季赏红叶的热门路线，适合家庭出游。",
    coordinates: [39.9865, 116.2004]
  },
  {
    id: 3,
    name: "峨眉山金顶步道",
    location: "乐山",
    region: "西南",
    difficulty: "困难",
    distance: "25公里",
    description: "通往峨眉山金顶的朝圣之路，挑战性强但景色壮丽。",
    coordinates: [29.5336, 103.3433]
  },
  {
    id: 4,
    name: "黄山登山步道",
    location: "黄山",
    region: "华东",
    difficulty: "中等",
    distance: "18公里",
    description: "穿越奇松怪石的经典登山路线，云海日出不容错过。",
    coordinates: [29.7118, 118.3300]
  },
  {
    id: 5,
    name: "张家界国家森林公园步道",
    location: "张家界",
    region: "华中",
    difficulty: "中等",
    distance: "15公里",
    description: "穿梭于悬浮山峰之间的奇幻步道，电影《阿凡达》取景地。",
    coordinates: [29.3972, 110.4397]
  },
  {
    id: 6,
    name: "华山长空栈道",
    location: "西安",
    region: "西北",
    difficulty: "困难",
    distance: "8公里",
    description: "中国最惊险的徒步路线之一，悬崖峭壁上的栈道体验。",
    coordinates: [34.4822, 110.0833]
  },
  {
    id: 7,
    name: "长白山天池环线",
    location: "延吉",
    region: "东北",
    difficulty: "中等",
    distance: "14公里",
    description: "环绕神秘天池的徒步路线，火山地貌与原始森林交织。",
    coordinates: [42.0083, 128.0625]
  },
  {
    id: 8,
    name: "丹霞山徒步路线",
    location: "韶关",
    region: "华南",
    difficulty: "简单",
    distance: "6公里",
    description: "世界自然遗产丹霞地貌的精华徒步路线，色彩斑斓。",
    coordinates: [24.8236, 113.7236]
  }
];

let map = null;
let markers = [];

// 初始化地图
function initMap(center = [35.8617, 104.1954]) { // 默认中国中心点
  if (map) {
    map.remove();
    markers = [];
  }

  map = L.map('trail-map').setView(center, 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  document.getElementById('map-section').classList.remove('hidden');
}

// 显示路线列表
function displayTrails(trails) {
  const container = document.getElementById('trails-container');
  container.innerHTML = '';
  
  // 清除现有标记
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  if (trails.length === 0) {
    showSection('noResults');
    return;
  }

  trails.forEach(trail => {
    const card = document.createElement('article');
    card.className = 'trail-card';
    card.innerHTML = `
      <h3>${trail.name}</h3>
      <p><strong>地点:</strong> ${trail.location} (${trail.region})</p>
      <p><strong>难度:</strong> <span class="difficulty ${trail.difficulty}">${trail.difficulty}</span></p>
      <p><strong>距离:</strong> ${trail.distance}</p>
      <p>${trail.description}</p>
    `;
    container.appendChild(card);

    // 添加地图标记
    const marker = L.marker(trail.coordinates).addTo(map)
      .bindPopup(`<b>${trail.name}</b><br>${trail.location}<br>难度: ${trail.difficulty}`);
    markers.push(marker);
  });

  showSection('trails-list');
  
  // 调整地图视图以包含所有标记
  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.1));
  }
}

// 显示指定区域
function showSection(sectionId) {
  ['loading', 'error', 'noResults', 'trails-list'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.classList.add('hidden');
    }
  });
  const targetElement = document.getElementById(sectionId);
  if (targetElement) {
    targetElement.classList.remove('hidden');
  }
}

// 综合搜索和筛选函数
function filterTrails(searchTerm = '', region = '', difficulty = '') {
  return mockTrails.filter(trail => {
    const matchesSearch = !searchTerm || 
      trail.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trail.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trail.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trail.difficulty.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = !region || trail.region === region;
    const matchesDifficulty = !difficulty || trail.difficulty === difficulty;
    
    return matchesSearch && matchesRegion && matchesDifficulty;
  });
}

// 获取当前位置
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('您的浏览器不支持地理位置定位'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      error => {
        let message = '无法获取您的位置';
        if (error.code === error.PERMISSION_DENIED) {
          message = '请允许网站访问您的位置信息';
        }
        reject(new Error(message));
      },
      { timeout: 10000 }
    );
  });
}

// 地理编码：将地址转换为坐标（简化版，实际应调用地理编码服务）
async function geocodeAddress(address) {
  // 简化处理：匹配 mock 数据中的城市
  const trail = mockTrails.find(t => t.location === address);
  if (trail) {
    return trail.coordinates;
  }

  // 如果未找到，返回中国中心点
  return [35.8617, 104.1954];
}

// 主搜索和筛选逻辑
function performSearch() {
  const searchTerm = document.getElementById('searchInput').value.trim();
  const region = document.getElementById('regionFilter').value;
  const difficulty = document.getElementById('difficultyFilter').value;
  
  const filteredTrails = filterTrails(searchTerm, region, difficulty);
  displayTrails(filteredTrails);
}

// 重置搜索
function resetSearch() {
  document.getElementById('searchInput').value = '';
  document.getElementById('regionFilter').value = '';
  document.getElementById('difficultyFilter').value = '';
  performSearch();
}

// 获取当前位置并搜索附近路线
async function useCurrentLocation() {
  showSection('loading');
  
  try {
    const position = await getCurrentLocation();
    initMap(position);
    // 显示所有路线，但地图会聚焦到当前位置
    displayTrails(mockTrails);
  } catch (error) {
    document.getElementById('error-message').textContent = error.message;
    showSection('error');
  }
}

// 地理编码：将地址转换为坐标（简化版，实际应调用地理编码服务）
async function geocodeAddress(address) {
  // 简化处理：匹配 mock 数据中的城市
  const trail = mockTrails.find(t => t.location.includes(address) || address.includes(t.location));
  if (trail) {
    return trail.coordinates;
  }

  // 如果未找到，返回中国中心点
  return [35.8617, 104.1954];
}

// 事件监听
document.getElementById('searchButton').addEventListener('click', performSearch);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});

document.getElementById('resetButton').addEventListener('click', resetSearch);
document.getElementById('regionFilter').addEventListener('change', performSearch);
document.getElementById('difficultyFilter').addEventListener('change', performSearch);
document.getElementById('useCurrentLocation').addEventListener('click', useCurrentLocation);

// 页面加载时初始化默认地图和显示所有路线
window.addEventListener('load', () => {
  initMap();
  displayTrails(mockTrails);
});