# 附近游泳馆地图

这是一个展示附近游泳馆位置的网页应用，使用Leaflet.js和OpenStreetMap构建。

## 功能特性

- 自动获取用户当前位置
- 显示附近的游泳馆位置（模拟数据）
- 响应式设计，支持移动设备
- 游泳馆详细信息卡片展示

## 技术栈

- HTML5 + CSS3 (语义化标签)
- Vanilla JavaScript (ES6+)
- Leaflet.js 地图库
- OpenStreetMap 瓦片服务

## 运行方式

1. 克隆或下载本项目
2. 在浏览器中直接打开 `index.html` 文件
3. 允许位置访问权限以获取当前位置

## 项目结构

```
swimming-pools-map/
├── index.html          # 主页面
├── styles.css         # 样式文件
├── script.js          # JavaScript逻辑
└── README.md          # 项目说明
```

## 注意事项

- 由于浏览器安全限制，需要在HTTPS环境下或本地文件系统中运行才能使用地理位置API
- 游泳馆数据为模拟数据，实际项目中可替换为真实API数据源