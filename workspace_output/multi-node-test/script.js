// 模拟多节点数据（实际项目中可替换为 API 调用）
const mockNodes = [
    { id: 1, name: 'Node-A', status: 'up', lastSeen: '2025-04-05T10:30:00Z' },
    { id: 2, name: 'Node-B', status: 'down', lastSeen: '2025-04-05T09:15:00Z' },
    { id: 3, name: 'Node-C', status: 'up', lastSeen: '2025-04-05T10:28:00Z' },
    { id: 4, name: 'Node-D', status: 'up', lastSeen: '2025-04-05T10:25:00Z' },
    { id: 5, name: 'Node-E', status: 'down', lastSeen: '2025-04-04T22:00:00Z' }
];

function formatTime(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
        return `${diffMins} 分钟前`;
    }
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
        return `${diffHours} 小时前`;
    }
    return date.toLocaleDateString('zh-CN');
}

function renderNodes(nodes) {
    const container = document.getElementById('nodes-container');
    container.innerHTML = '';

    if (nodes.length === 0) {
        container.innerHTML = '<p>暂无节点数据。</p>';
        return;
    }

    nodes.forEach(node => {
        const card = document.createElement('div');
        card.className = `node-card status-${node.status}`;
        card.innerHTML = `
            <h3>${node.name}</h3>
            <div>
                <span class="node-status status-${node.status}">
                    ${node.status === 'up' ? '在线' : '离线'}
                </span>
            </div>
            <p>最后活跃：${formatTime(node.lastSeen)}</p>
        `;
        container.appendChild(card);
    });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 模拟加载延迟
    setTimeout(() => {
        renderNodes(mockNodes);
    }, 500);
});