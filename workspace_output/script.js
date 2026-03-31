// 全国徒步路线数据
const hikingRoutes = [
    {
        id: 1,
        name: "黄山徒步路线",
        location: "安徽省黄山市",
        region: "华东",
        difficulty: "中等",
        distance: "15公里",
        duration: "6-8小时",
        elevation: "1864米",
        rating: 4.8,
        description: "黄山以其奇松、怪石、云海、温泉四绝著称，徒步路线穿越多个著名景点，包括迎客松、光明顶等。",
        image: "https://images.unsplash.com/photo-1506318124179-a7c7a7f9e5d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 2,
        name: "张家界天门山玻璃栈道",
        location: "湖南省张家界市",
        region: "华中",
        difficulty: "简单",
        distance: "3公里",
        duration: "2-3小时",
        elevation: "1518米",
        rating: 4.6,
        description: "世界最长的高山峡谷玻璃栈道，全长600米，悬于海拔1400多米的峭壁之上，惊险刺激。",
        image: "https://images.unsplash.com/photo-1543857778-c4a1a569e7bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 3,
        name: "稻城亚丁徒步路线",
        location: "四川省甘孜州",
        region: "西南",
        difficulty: "困难",
        distance: "30公里",
        duration: "2-3天",
        elevation: "4700米",
        rating: 4.9,
        description: "被誉为'最后的香格里拉'，徒步路线穿越三座神山，沿途可欣赏高原湖泊、雪山、草甸等绝美风光。",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 4,
        name: "泰山十八盘",
        location: "山东省泰安市",
        region: "华北",
        difficulty: "中等",
        distance: "8公里",
        duration: "4-6小时",
        elevation: "1545米",
        rating: 4.5,
        description: "泰山最险要的路段，共有1633级台阶，是登泰山必经之路，沿途可欣赏壮丽的日出景观。",
        image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 5,
        name: "长白山天池环线",
        location: "吉林省延边州",
        region: "东北",
        difficulty: "中等",
        distance: "12公里",
        duration: "5-7小时",
        elevation: "2189米",
        rating: 4.7,
        description: "环绕长白山天池的徒步路线，可近距离观赏火山口湖和周围的原始森林，夏季野花盛开，景色宜人。",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 6,
        name: "梅里雪山雨崩徒步",
        location: "云南省迪庆州",
        region: "西南",
        difficulty: "困难",
        distance: "25公里",
        duration: "2天",
        elevation: "3200米",
        rating: 4.9,
        description: "深入梅里雪山腹地的秘境徒步，沿途经过冰湖、神瀑等景点，是摄影爱好者和户外探险者的天堂。",
        image: "https://images.unsplash.com/photo-1506318124179-a7c7a7f9e5d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 7,
        name: "华山长空栈道",
        location: "陕西省华阴市",
        region: "西北",
        difficulty: "困难",
        distance: "2公里",
        duration: "3-4小时",
        elevation: "2154米",
        rating: 4.4,
        description: "被誉为'天下第一险'，是在悬崖峭壁上开凿的栈道，最窄处仅容半只脚，需要系安全绳通行。",
        image: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
        id: 8,
        name: "桂林漓江徒步",
        location: "广西桂林市",
        region: "华南",
        difficulty: "简单",
        distance: "10公里",
        duration: "3-4小时",
        elevation: "150米",
        rating: 4.6,
        description: "沿着漓江两岸徒步，欣赏喀斯特地貌和田园风光，山水相映成趣，如诗如画。",
        image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    }
];

// DOM元素引用
const routesContainer = document.getElementById('routesContainer');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resetButton = document.getElementById('resetButton');
const regionFilter = document.getElementById('regionFilter');
const difficultyFilter = document.getElementById('difficultyFilter');
const noResults = document.getElementById('noResults');

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    displayRoutes(hikingRoutes);
    
    // 绑定搜索事件
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 绑定筛选器事件
    regionFilter.addEventListener('change', performSearch);
    difficultyFilter.addEventListener('change', performSearch);
    
    // 绑定重置按钮事件
    resetButton.addEventListener('click', resetFilters);
});

// 执行搜索和筛选
function performSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedRegion = regionFilter.value;
    const selectedDifficulty = difficultyFilter.value;
    
    let filteredRoutes = hikingRoutes.filter(route => {
        // 搜索条件匹配
        const matchesSearch = !searchTerm || 
            route.name.toLowerCase().includes(searchTerm) ||
            route.location.toLowerCase().includes(searchTerm) ||
            route.region.toLowerCase().includes(searchTerm) ||
            route.difficulty.toLowerCase().includes(searchTerm);
        
        // 地区筛选
        const matchesRegion = !selectedRegion || route.region === selectedRegion;
        
        // 难度筛选
        const matchesDifficulty = !selectedDifficulty || route.difficulty === selectedDifficulty;
        
        return matchesSearch && matchesRegion && matchesDifficulty;
    });
    
    displayRoutes(filteredRoutes);
}

// 重置筛选条件
function resetFilters() {
    searchInput.value = '';
    regionFilter.value = '';
    difficultyFilter.value = '';
    displayRoutes(hikingRoutes);
}

// 显示路线卡片
function displayRoutes(routes) {
    if (routes.length === 0) {
        routesContainer.innerHTML = '';
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
        routesContainer.innerHTML = routes.map(route => createRouteCard(route)).join('');
    }
}

// 创建单个路线卡片
function createRouteCard(route) {
    // 根据难度设置CSS类
    let difficultyClass = '';
    if (route.difficulty === '简单') {
        difficultyClass = 'difficulty-easy';
    } else if (route.difficulty === '中等') {
        difficultyClass = 'difficulty-medium';
    } else {
        difficultyClass = 'difficulty-hard';
    }
    
    // 生成评分星星
    const fullStars = Math.floor(route.rating);
    const hasHalfStar = route.rating % 1 >= 0.5;
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star" style="color: #ffc107;"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt" style="color: #ffc107;"></i>';
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star" style="color: #ddd;"></i>';
    }
    
    return `
        <div class="route-card" onclick="showRouteDetails(${route.id})">
            <div class="route-image" style="background-image: url('${route.image}')"></div>
            <div class="route-info">
                <h3 class="route-title">${route.name}</h3>
                <div class="route-location">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                    </svg>
                    ${route.location}
                </div>
                <div class="route-details">
                    <div class="route-detail">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
                            <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
                        </svg>
                        ${route.distance}
                    </div>
                    <div class="route-detail">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
                            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
                        </svg>
                        ${route.duration}
                    </div>
                    <div class="route-detail">
                        <span class="${difficultyClass}">${route.difficulty}</span>
                    </div>
                </div>
                <div class="route-rating">
                    ${starsHTML} (${route.rating})
                </div>
                <p class="route-description">${route.description}</p>
            </div>
        </div>
    `;
}

// 显示路线详情
function showRouteDetails(routeId) {
    const route = hikingRoutes.find(r => r.id === routeId);
    if (!route) return;
    
    const modal = document.getElementById('routeModal');
    const modalContent = document.getElementById('modalContent');
    
    // 生成评分星星
    const fullStars = Math.floor(route.rating);
    const hasHalfStar = route.rating % 1 >= 0.5;
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star" style="color: #ffc107;"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt" style="color: #ffc107;"></i>';
    }
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star" style="color: #ddd;"></i>';
    }
    
    modalContent.innerHTML = `
        <div class="modal-image" style="background-image: url('${route.image}')"></div>
        <div class="modal-info">
            <h2 class="modal-title">${route.name}</h2>
            <div class="modal-location">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
                </svg>
                ${route.location}
            </div>
            <div class="modal-details">
                <div class="modal-detail-item">
                    <span class="modal-detail-label">距离</span>
                    <span class="modal-detail-value">${route.distance}</span>
                </div>
                <div class="modal-detail-item">
                    <span class="modal-detail-label">预计时间</span>
                    <span class="modal-detail-value">${route.duration}</span>
                </div>
                <div class="modal-detail-item">
                    <span class="modal-detail-label">海拔</span>
                    <span class="modal-detail-value">${route.elevation}</span>
                </div>
                <div class="modal-detail-item">
                    <span class="modal-detail-label">难度</span>
                    <span class="modal-detail-value ${route.difficulty === '简单' ? 'difficulty-easy' : route.difficulty === '中等' ? 'difficulty-medium' : 'difficulty-hard'}">${route.difficulty}</span>
                </div>
            </div>
            <div class="modal-rating">
                ${starsHTML} (${route.rating})
            </div>
            <p class="modal-description">${route.description}</p>
        </div>
    `;
    
    modal.style.display = 'block';
    
    // 绑定关闭事件
    const closeBtn = document.querySelector('.close');
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    };
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}