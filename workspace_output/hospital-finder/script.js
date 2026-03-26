// 医院数据模拟（实际项目中应从API获取）
const mockHospitals = [
    {
        id: 1,
        name: "北京协和医院",
        address: "北京市东城区帅府园1号",
        lat: 39.9167,
        lng: 116.4039,
        distance: "1.2公里"
    },
    {
        id: 2,
        name: "北京大学第一医院",
        address: "北京市西城区西什库大街8号",
        lat: 39.9289,
        lng: 116.3883,
        distance: "2.5公里"
    },
    {
        id: 3,
        name: "北京同仁医院",
        address: "北京市东城区东交民巷1号",
        lat: 39.9086,
        lng: 116.4123,
        distance: "0.8公里"
    },
    {
        id: 4,
        name: "北京儿童医院",
        address: "北京市西城区南礼士路56号",
        lat: 39.9139,
        lng: 116.3467,
        distance: "3.1公里"
    },
    {
        id: 5,
        name: "北京朝阳医院",
        address: "北京市朝阳区工体南路8号",
        lat: 39.9219,
        lng: 116.4639,
        distance: "4.2公里"
    }
];

let currentLocation = null;
let map = null;
let markers = [];

// 初始化地图
function initMap() {
    if (!map) {
        map = new BMapGL.Map("mapContainer");
        // 设置默认中心点（北京）
        const defaultPoint = new BMapGL.Point(116.404, 39.915);
        map.centerAndZoom(defaultPoint, 12);
        map.enableScrollWheelZoom(true);
    }
}

// 获取用户当前位置
function getCurrentLocation() {
    const locateBtn = document.getElementById('locateBtn');
    locateBtn.innerHTML = '📍 定位中...';
    locateBtn.disabled = true;
    
    // 模拟获取位置（实际项目中使用 navigator.geolocation.getCurrentPosition）
    setTimeout(() => {
        // 使用北京的坐标作为示例
        currentLocation = { lat: 39.915, lng: 116.404 };
        displayHospitals();
        updateMapWithLocation();
        locateBtn.innerHTML = '📍 重新定位';
        locateBtn.disabled = false;
    }, 1000);
}

// 显示医院列表
function displayHospitals() {
    const hospitalsList = document.getElementById('hospitalsList');
    hospitalsList.innerHTML = '';
    
    mockHospitals.forEach(hospital => {
        const hospitalDiv = document.createElement('div');
        hospitalDiv.className = 'hospital-item';
        hospitalDiv.innerHTML = `
            <div class="hospital-name">${hospital.name}</div>
            <div class="hospital-address">${hospital.address}</div>
            <div class="hospital-distance">距离: ${hospital.distance}</div>
        `;
        
        hospitalDiv.addEventListener('click', () => {
            showRouteToHospital(hospital);
        });
        
        hospitalsList.appendChild(hospitalDiv);
    });
}

// 更新地图显示当前位置和医院标记
function updateMapWithLocation() {
    if (!currentLocation || !map) return;
    
    // 清除之前的标记
    markers.forEach(marker => map.removeOverlay(marker));
    markers = [];
    
    // 添加当前位置标记
    const userPoint = new BMapGL.Point(currentLocation.lng, currentLocation.lat);
    const userMarker = new BMapGL.Marker(userPoint);
    map.addOverlay(userMarker);
    markers.push(userMarker);
    
    // 设置地图中心为用户位置
    map.setCenter(userPoint);
    
    // 添加医院标记
    mockHospitals.forEach(hospital => {
        const hospitalPoint = new BMapGL.Point(hospital.lng, hospital.lat);
        const hospitalMarker = new BMapGL.Marker(hospitalPoint);
        map.addOverlay(hospitalMarker);
        markers.push(hospitalMarker);
        
        // 添加信息窗口
        const infoWindow = new BMapGL.InfoWindow(`
            <div style="padding: 10px;">
                <h4>${hospital.name}</h4>
                <p>${hospital.address}</p>
                <p>距离: ${hospital.distance}</p>
                <button onclick="showRoute(${hospital.id})" style="margin-top: 10px; padding: 5px 10px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">导航到此</button>
            </div>
        `);
        hospitalMarker.addEventListener('click', () => {
            map.openInfoWindow(infoWindow, hospitalPoint);
        });
    });
}

// 显示路线到指定医院
function showRouteToHospital(hospital) {
    const routePanel = document.getElementById('routePanel');
    const routeInfo = document.getElementById('routeInfo');
    
    // 模拟路线信息
    routeInfo.innerHTML = `
        <p><strong>起点:</strong> 您的当前位置</p>
        <p><strong>终点:</strong> ${hospital.name}</p>
        <p><strong>距离:</strong> ${hospital.distance}</p>
        <p><strong>预计时间:</strong> 约${Math.ceil(parseFloat(hospital.distance) * 2)}分钟</p>
        <p><strong>路线:</strong> 向东行驶 → 转入主干道 → 直行至医院</p>
    `;
    
    routePanel.style.display = 'block';
    
    // 滚动到路线面板
    routePanel.scrollIntoView({ behavior: 'smooth' });
}

// 关闭路线面板
function closeRoutePanel() {
    document.getElementById('routePanel').style.display = 'none';
}

// 搜索医院
function searchHospitals() {
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!searchTerm) {
        displayHospitals();
        return;
    }
    
    const filteredHospitals = mockHospitals.filter(hospital => 
        hospital.name.toLowerCase().includes(searchTerm) || 
        hospital.address.toLowerCase().includes(searchTerm)
    );
    
    const hospitalsList = document.getElementById('hospitalsList');
    hospitalsList.innerHTML = '';
    
    if (filteredHospitals.length === 0) {
        hospitalsList.innerHTML = '<p class="placeholder-text">未找到匹配的医院</p>';
        return;
    }
    
    filteredHospitals.forEach(hospital => {
        const hospitalDiv = document.createElement('div');
        hospitalDiv.className = 'hospital-item';
        hospitalDiv.innerHTML = `
            <div class="hospital-name">${hospital.name}</div>
            <div class="hospital-address">${hospital.address}</div>
            <div class="hospital-distance">距离: ${hospital.distance}</div>
        `;
        
        hospitalDiv.addEventListener('click', () => {
            showRouteToHospital(hospital);
        });
        
        hospitalsList.appendChild(hospitalDiv);
    });
}

// 全局函数供信息窗口调用
window.showRoute = function(hospitalId) {
    const hospital = mockHospitals.find(h => h.id === hospitalId);
    if (hospital) {
        showRouteToHospital(hospital);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    
    // 绑定事件
    document.getElementById('locateBtn').addEventListener('click', getCurrentLocation);
    document.getElementById('searchBtn').addEventListener('click', searchHospitals);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchHospitals();
        }
    });
    document.getElementById('closeRouteBtn').addEventListener('click', closeRoutePanel);
    
    // 提示用户需要获取位置
    const hospitalsList = document.getElementById('hospitalsList');
    hospitalsList.innerHTML = '<p class="placeholder-text">点击"获取我的位置"开始查找附近医院</p>';
});