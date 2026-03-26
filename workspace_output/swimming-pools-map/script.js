// 游泳馆模拟数据
const swimmingPools = [
    {
        id: 1,
        name: "城市体育中心游泳馆",
        address: "北京市朝阳区体育路123号",
        phone: "010-12345678",
        openingHours: "06:00-22:00",
        price: "¥30/次",
        facilities: ["更衣室", "淋浴", "储物柜", "救生员"],
        lat: 39.9042,
        lng: 116.4074,
        rating: 4.5
    },
    {
        id: 2,
        name: "阳光健身游泳俱乐部",
        address: "北京市海淀区中关村大街456号",
        phone: "010-87654321",
        openingHours: "07:00-21:00",
        price: "¥50/次",
        facilities: ["恒温泳池", "儿童池", "按摩池", "咖啡厅"],
        lat: 39.9522,
        lng: 116.3840,
        rating: 4.8
    },
    {
        id: 3,
        name: "海豚游泳训练中心",
        address: "北京市西城区平安大街789号",
        phone: "010-56781234",
        openingHours: "08:00-20:00",
        price: "¥40/次",
        facilities: ["专业教练", "训练课程", "比赛泳池", "休息区"],
        lat: 39.9139,
        lng: 116.3630,
        rating: 4.3
    },
    {
        id: 4,
        name: "蓝海国际游泳馆",
        address: "北京市东城区王府井大街234号",
        phone: "010-43218765",
        openingHours: "06:30-22:30",
        price: "¥60/次",
        facilities: ["室内恒温", "VIP包厢", "餐饮服务", "停车场"],
        lat: 39.9163,
        lng: 116.4130,
        rating: 4.7
    },
    {
        id: 5,
        name: "青春活力游泳中心",
        address: "北京市丰台区南三环西路567号",
        phone: "010-98765432",
        openingHours: "07:30-21:30",
        price: "¥35/次",
        facilities: ["学生优惠", "团体票", "基础设施", "安全监控"],
        lat: 39.8560,
        lng: 116.3680,
        rating: 4.2
    }
];

class SwimmingPoolsMap {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.poolMarkers = [];
        this.currentLocation = null;
        this.init();
    }

    init() {
        this.initializeMap();
        this.bindEvents();
        this.loadPoolsData();
    }

    initializeMap() {
        // 初始化地图，设置默认中心点（北京）
        this.map = L.map('map').setView([39.9042, 116.4074], 12);
        
        // 添加OpenStreetMap瓦片图层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
    }

    bindEvents() {
        document.getElementById('locate-btn').addEventListener('click', () => {
            this.getCurrentLocation();
        });
    }

    getCurrentLocation() {
        const statusMessage = document.getElementById('status-message');
        
        if (!navigator.geolocation) {
            this.showStatus('您的浏览器不支持地理位置功能。', 'error');
            return;
        }

        this.showStatus('正在获取您的位置...', 'success');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                this.updateMapCenter();
                this.calculateDistances();
                this.showStatus('位置获取成功！', 'success');
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = '无法获取您的位置。';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = '您拒绝了位置访问权限。';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = '位置信息不可用。';
                        break;
                    case error.TIMEOUT:
                        errorMessage = '获取位置超时。';
                        break;
                }
                this.showStatus(errorMessage, 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    updateMapCenter() {
        this.map.setView([this.currentLocation.lat, this.currentLocation.lng], 14);
        
        // 移除之前的用户标记
        if (this.userMarker) {
            this.map.removeLayer(this.userMarker);
        }
        
        // 添加用户当前位置标记
        this.userMarker = L.marker([this.currentLocation.lat, this.currentLocation.lng], {
            title: '您的位置'
        }).addTo(this.map);
        
        // 添加用户位置圆圈
        L.circle([this.currentLocation.lat, this.currentLocation.lng], {
            color: '#2F4F4F',
            fillColor: '#2F4F4F',
            fillOpacity: 0.1,
            radius: 2000
        }).addTo(this.map);
    }

    calculateDistances() {
        // 计算每个游泳馆到用户当前位置的距离
        swimmingPools.forEach(pool => {
            if (this.currentLocation) {
                const distance = this.getDistance(
                    this.currentLocation.lat, 
                    this.currentLocation.lng, 
                    pool.lat, 
                    pool.lng
                );
                pool.distance = distance;
            } else {
                pool.distance = null;
            }
        });
        
        // 按距离排序（如果有的话）
        if (this.currentLocation) {
            swimmingPools.sort((a, b) => a.distance - b.distance);
        }
        
        this.renderPoolsCards();
        this.updatePoolMarkers();
    }

    getDistance(lat1, lon1, lat2, lon2) {
        // 使用Haversine公式计算两点间距离（公里）
        const R = 6371; // 地球半径（公里）
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        return Math.round(distance * 100) / 100; // 保留两位小数
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    renderPoolsCards() {
        const poolsCardsContainer = document.getElementById('pools-cards');
        poolsCardsContainer.innerHTML = '';
        
        swimmingPools.forEach(pool => {
            const card = document.createElement('article');
            card.className = 'pool-card';
            card.innerHTML = `
                <h3>${pool.name}</h3>
                <div class="address">${pool.address}</div>
                <div class="details">
                    <div class="detail-item">
                        <span>电话:</span>
                        <span>${pool.phone}</span>
                    </div>
                    <div class="detail-item">
                        <span>营业时间:</span>
                        <span>${pool.openingHours}</span>
                    </div>
                    <div class="detail-item">
                        <span>价格:</span>
                        <span>${pool.price}</span>
                    </div>
                    <div class="detail-item">
                        <span>评分:</span>
                        <span>⭐ ${pool.rating}</span>
                    </div>
                    ${pool.distance !== null ? `
                    <div class="detail-item">
                        <span>距离:</span>
                        <span class="distance">${pool.distance} 公里</span>
                    </div>
                    ` : ''}
                    <div class="detail-item">
                        <span>设施:</span>
                        <span>${pool.facilities.join(', ')}</span>
                    </div>
                </div>
            `;
            poolsCardsContainer.appendChild(card);
        });
    }

    updatePoolMarkers() {
        // 移除所有现有的游泳馆标记
        this.poolMarkers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.poolMarkers = [];
        
        // 添加新的游泳馆标记
        swimmingPools.forEach(pool => {
            const marker = L.marker([pool.lat, pool.lng], {
                title: pool.name
            }).addTo(this.map);
            
            // 添加点击弹窗
            marker.bindPopup(`
                <strong>${pool.name}</strong><br>
                ${pool.address}<br>
                📞 ${pool.phone}<br>
                ⭐ ${pool.rating}<br>
                ${pool.distance !== null ? `📍 距离: ${pool.distance} 公里` : ''}
            `);
            
            this.poolMarkers.push(marker);
        });
    }

    loadPoolsData() {
        // 初始加载所有游泳馆（无距离信息）
        swimmingPools.forEach(pool => {
            pool.distance = null;
        });
        this.renderPoolsCards();
        this.updatePoolMarkers();
    }

    showStatus(message, type) {
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        
        // 3秒后自动清除状态消息
        setTimeout(() => {
            if (statusMessage.textContent === message) {
                statusMessage.textContent = '';
                statusMessage.className = 'status-message';
            }
        }, 3000);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new SwimmingPoolsMap();
});