# Trail Finder - 足迹追踪应用

这是一个基于浏览器地理位置API和Leaflet地图的足迹追踪应用，帮助用户记录和查看自己的行走轨迹。

## 功能特性

- 📍 实时获取用户当前位置
- 🗺️ 在交互式地图上显示位置
- 🚶‍♂️ 记录行走轨迹
- 📊 显示距离和时间统计
- 📱 响应式设计，支持移动设备

## 技术栈

- **HTML5** - 语义化结构
- **CSS3** - 现代样式和响应式布局
- **JavaScript (ES6+)** - 无框架的原生实现
- **Leaflet.js** - 轻量级地图库
- **OpenStreetMap** - 免费地图数据

## 使用方法

1. 在现代浏览器中打开 `index.html`
2. 允许网站访问您的位置信息
3. 应用会自动开始追踪您的位置并在地图上显示轨迹
4. 可以随时暂停/恢复追踪或清除轨迹

## 浏览器兼容性

- Chrome 50+
- Firefox 45+
- Safari 10+
- Edge 79+

> **注意**: 由于安全限制，地理位置API在HTTPS环境下工作最佳。在本地文件系统(file://)中可能无法正常工作，建议通过本地服务器运行。

## 开发说明

### 文件结构
```
trail_finder/
├── index.html          # 主页面
├── README.md          # 项目说明
└── assets/            # 静态资源目录
    ├── css/
    │   └── style.css  # 样式文件
    └── js/
        └── app.js     # 应用逻辑
```

### 依赖项
- Leaflet.js (通过CDN加载)
- OpenStreetMap tiles

## 许可证

MIT License