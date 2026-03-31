// 最小JavaScript功能
document.addEventListener('DOMContentLoaded', function() {
    const button = document.getElementById('clickMe');
    const message = document.getElementById('message');
    
    button.addEventListener('click', function() {
        message.textContent = '你成功点击了按钮！';
    });
});