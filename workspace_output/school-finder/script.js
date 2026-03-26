// 全局变量
let map = null;
let userMarker = null;
let schoolMarkers = [];

// DOM 元素
const locateBtn = document.getElementById('locateBtn');
const statusDiv = document.getElementById('status');
const schoolsList = document.getElementById('schoolsList');

// 初始化地图（默认中心点）
function initMap(lat = 39.9042, lng = 116.4074) {
  if (map) return;

  map = L.map('map').setView([lat, lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
}

// 显示状态信息
function showStatus(message, isError = false) {
  statusDiv.textContent = message;
  statusDiv.style.color = isError ? 'red' : 'green';
}

// 清除现有标记
function clearMarkers() {
  if (userMarker) {
    map.removeLayer(userMarker);
    userMarker = null;
  }
  schoolMarkers.forEach(marker => map.removeLayer(marker));
  schoolMarkers = [];
  schoolsList.innerHTML = '';
}

// 模拟学校数据（实际项目中应替换为真实 API 调用）
function fetchSchoolsNear(lat, lng) {
  // 模拟附近学校数据（基于用户位置偏移）
  const mockSchools = [
    { name: '第一实验小学', lat: lat + 0.01, lng: lng + 0.005, type: '小学' },
    { name: '阳光中学', lat: lat - 0.008, lng: lng - 0.007, type: '中学' },
    { name: '市立高级中学', lat: lat + 0.015, lng: lng - 0.01, type: '高中' },
    { name: '希望小学', lat: lat - 0.012, lng: lng + 0.009, type: '小学' },
    { name: '科技职业技术学院', lat: lat + 0.005, lng: lng + 0.015, type: '大学' }
  ];
  
  return new Promise(resolve => {
    setTimeout(() => resolve(mockSchools), 500); // 模拟网络延迟
  });
}

// 在地图上添加学校标记并生成列表
function displaySchools(schools, userLat, userLng) {
  schools.forEach(school => {
    // 添加标记到地图
    const marker = L.marker([school.lat, school.lng]).addTo(map);
    marker.bindPopup(`<b>${school.name}</b><br>类型: ${school.type}`);
    schoolMarkers.push(marker);

    // 创建学校卡片
    const article = document.createElement('article');
    article.className = 'school-card';
    article.innerHTML = `
      <h3>${school.name}</h3>
      <p>类型: ${school.type}</p>
      <p>距离: ${(Math.sqrt(Math.pow(school.lat - userLat, 2) + Math.pow(school.lng - userLng, 2)) * 111).toFixed(1)} 公里</p>
    `;
    schoolsList.appendChild(article);
  });
}

// 定位并查找学校主函数
async function locateAndFindSchools() {
  clearMarkers();
  showStatus('正在获取您的位置...');

  try {
    // 获取用户当前位置
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });

    const { latitude, longitude } = position.coords;
    showStatus('定位成功，正在查找附近学校...');

    // 初始化或重置地图中心
    if (!map) {
      initMap(latitude, longitude);
    } else {
      map.setView([latitude, longitude], 14);
    }

    // 添加用户位置标记
    userMarker = L.marker([latitude, longitude], {
      icon: L.divIcon({
        className: 'user-location-icon',
        html: '<div style="background:red;width:12px;height:12px;border-radius:50%;"></div>',
        iconSize: [12, 12]
      })
    }).addTo(map);
    userMarker.bindPopup('您的位置').openPopup();

    // 获取附近学校
    const schools = await fetchSchoolsNear(latitude, longitude);
    showStatus(`找到 ${schools.length} 所学校`);
    
    // 显示结果
    displaySchools(schools, latitude, longitude);

  } catch (error) {
    console.error('定位失败:', error);
    showStatus('无法获取位置：' + (error.message || '请允许位置权限'), true);
    
    // 如果定位失败，使用默认位置初始化地图
    if (!map) {
      initMap();
      showStatus('使用默认位置显示地图', true);
    }
  }
}

// 事件监听
locateBtn.addEventListener('click', locateAndFindSchools);

// 页面加载时初始化地图（默认位置）
window.addEventListener('load', () => {
  initMap();
});