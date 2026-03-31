// Initialize map centered on a default location (e.g., Beijing)
const map = L.map('map').setView([39.9042, 116.4074], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let userMarker = null;

document.getElementById('locate-btn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 14);

                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                userMarker = L.marker([latitude, longitude])
                    .addTo(map)
                    .bindPopup('您的位置')
                    .openPopup();

                // Simulate nearby trails (in a real app, fetch from an API)
                loadNearbyTrails(latitude, longitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('无法获取您的位置，请检查浏览器权限。');
            }
        );
    } else {
        alert('您的浏览器不支持地理定位。');
    }
});

function loadNearbyTrails(lat, lng) {
    // Mock trail data for demo
    const mockTrails = [
        {
            id: 1,
            name: '香山公园步道',
            distance: '5.2 km',
            difficulty: '中等',
            description: '秋季红叶著名，适合半日徒步。'
        },
        {
            id: 2,
            name: '百望山森林公园',
            distance: '3.8 km',
            difficulty: '简单',
            description: '市区近郊，适合家庭出游。'
        },
        {
            id: 3,
            name: '妙峰山古香道',
            distance: '8.1 km',
            difficulty: '困难',
            description: '历史古道，视野开阔。'
        }
    ];

    const container = document.getElementById('trails-container');
    container.innerHTML = '';

    mockTrails.forEach(trail => {
        const article = document.createElement('article');
        article.className = 'trail-card';
        article.innerHTML = `
            <h3>${trail.name}</h3>
            <p><strong>距离:</strong> ${trail.distance}</p>
            <p><strong>难度:</strong> ${trail.difficulty}</p>
            <p>${trail.description}</p>
        `;
        container.appendChild(article);
    });
}