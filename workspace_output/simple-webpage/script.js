// 简单网页的交互功能

document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const changeColorBtn = document.getElementById('changeColor');
    const showMessageBtn = document.getElementById('showMessage');
    const messageDiv = document.getElementById('message');
    
    // 背景颜色变化功能
    const colors = ['#f4f4f4', '#e8f4f8', '#f9f3ff', '#fff8e1', '#e8f5e9'];
    let currentColorIndex = 0;
    
    changeColorBtn.addEventListener('click', function() {
        currentColorIndex = (currentColorIndex + 1) % colors.length;
        document.body.style.backgroundColor = colors[currentColorIndex];
        
        // 添加一个短暂的视觉反馈
        this.textContent = '颜色已改变!';
        setTimeout(() => {
            this.textContent = '点击改变背景颜色';
        }, 1000);
    });
    
    // 显示消息功能
    showMessageBtn.addEventListener('click', function() {
        const messages = [
            '你好！这是一个简单的交互示例。',
            '欢迎探索这个网页的功能！',
            'JavaScript让网页变得更加生动有趣！',
            '你可以继续点击来查看不同的消息。',
            '感谢访问这个简单但实用的网页示例！'
        ];
        
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        messageDiv.textContent = randomMessage;
        messageDiv.style.display = 'block';
        
        // 添加淡入效果
        messageDiv.style.opacity = '0';
        messageDiv.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            messageDiv.style.opacity = '1';
        }, 10);
    });
    
    // 添加一些额外的交互 - 点击页面任意位置显示当前时间
    document.body.addEventListener('click', function(e) {
        // 只在点击空白区域时触发（避免干扰按钮）
        if (e.target.tagName === 'BODY' || e.target.classList.contains('container')) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('zh-CN');
            console.log('当前时间:', timeString);
        }
    });
});