/**
 * Trail Finder - 足迹追踪应用
 * 使用Geolocation API和Leaflet地图实现位置追踪
 */

class TrailFinder {
    constructor() {
        this.map = null;
        this.currentMarker = null;
        this.trailPolyline = null;
        this.trailPoints = [];
        this.watchId = null;
        this.isTracking = false;
        this.startTime = null;
        this.lastPosition = null;
        this.totalDistance = 0;
        
        // DOM元素引用
        this.elements = {
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            clearBtn: document.getElementById('clearBtn'),
            distanceValue: document.getElementById('distanceValue'),
            timeValue: document.getElementById('timeValue'),
            pointsValue: document.getElementById('pointsValue'),
            statusMessage: document.getElementById('statusMessage'),
            mapContainer: document.getElementById('map')
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initMap();
        this.updateUI();
    }
    
    setupEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startTracking());
        this.elements.stopBtn.addEventListener('click', () => this.stopTracking());
        this.elements.clearBtn.addEventListener('click', () => this.clearTrail());
    }
    
    initMap() {
        // 初始化地图，中心点设为默认位置（北京）
        this.map = L.map('map').setView([39.9042, 116.4074], 13);
        
        // 添加OpenStreetMap图层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);
        
        // 显示加载状态
        this.showStatus('等待位置信息...');
    }
    
    startTracking() {
        if (this.isTracking) return;
        
        if (!navigator.geolocation) {
            this.showError('您的浏览器不支持地理位置功能');
            return;
        }
        
        this.isTracking = true;
        this.startTime = new Date();
        this.lastPosition = null;
        this.totalDistance = 0;
        this.trailPoints = [];
        
        // 开始监听位置变化
        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.onPositionSuccess(position),
            (error) => this.onPositionError(error),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
        
        this.updateUI();
        this.showStatus('正在追踪位置...');
    }
    
    stopTracking() {
        if (!this.isTracking) return;
        
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        this.isTracking = false;
        this.updateUI();
        this.showStatus('追踪已暂停');
    }
    
    clearTrail() {
        this.stopTracking();
        this.trailPoints = [];
        this.totalDistance = 0;
        this.lastPosition = null;
        
        // 清除地图上的标记和轨迹
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
            this.currentMarker = null;
        }
        
        if (this.trailPolyline) {
            this.map.removeLayer(this.trailPolyline);
            this.trailPolyline = null;
        }
        
        this.updateUI();
        this.showStatus('轨迹已清除');
    }
    
    onPositionSuccess(position) {
        const { latitude, longitude } = position.coords;
        const latlng = L.latLng(latitude, longitude);
        
        // 更新当前位置标记
        if (this.currentMarker) {
            this.currentMarker.setLatLng(latlng);
        } else {
            this.currentMarker = L.marker(latlng).addTo(this.map);
        }
        
        // 如果是第一个点，直接添加到轨迹
        if (this.lastPosition === null) {
            this.trailPoints.push(latlng);
            this.lastPosition = position.coords;
        } else {
            // 计算距离并添加到轨迹
            const distance = this.calculateDistance(
                this.lastPosition.latitude,
                this.lastPosition.longitude,
                latitude,
                longitude
            );
            
            this.totalDistance += distance;
            this.lastPosition = position.coords;
            this.trailPoints.push(latlng);
            
            // 更新轨迹线
            if (this.trailPolyline) {
                this.trailPolyline.setLatLngs(this.trailPoints);
            } else {
                this.trailPolyline = L.polyline(this.trailPoints, {
                    color: '#667eea',
                    weight: 4,
                    opacity: 0.8
                }).addTo(this.map);
            }
        }
        
        // 调整地图视图到当前位置
        this.map.setView(latlng, 16);
        
        // 更新UI
        this.updateStats();
        this.updateUI();
    }
    
    onPositionError(error) {
        this.isTracking = false;
        this.updateUI();
        
        let message = '获取位置时发生错误';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = '用户拒绝了位置请求';
                break;
            case error.POSITION_UNAVAILABLE:
                message = '位置信息不可用';
                break;
            case error.TIMEOUT:
                message = '位置请求超时';
                break;
        }
        
        this.showError(message);
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        // 使用Haversine公式计算两点间距离（单位：米）
        const R = 6371000; // 地球半径（米）
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;
        
        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        return R * c;
    }
    
    updateStats() {
        // 更新距离显示（转换为公里，保留2位小数）
        const distanceKm = (this.totalDistance / 1000).toFixed(2);
        this.elements.distanceValue.textContent = `${distanceKm} km`;
        
        // 更新时间显示
        if (this.startTime) {
            const elapsed = new Date() - this.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            this.elements.timeValue.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // 更新点数显示
        this.elements.pointsValue.textContent = this.trailPoints.length.toString();
    }
    
    updateUI() {
        // 更新按钮状态
        this.elements.startBtn.disabled = this.isTracking;
        this.elements.stopBtn.disabled = !this.isTracking;
        this.elements.clearBtn.disabled = this.trailPoints.length === 0;
    }
    
    showStatus(message) {
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.className = 'status-message';
    }
    
    showError(message) {
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.className = 'error-message';
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new TrailFinder();
});