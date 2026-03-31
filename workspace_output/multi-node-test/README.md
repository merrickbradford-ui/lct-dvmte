# Multi Node Test

一个用于展示多节点状态的静态测试页面。

## 功能特点

- 展示多个节点的在线/离线状态
- 显示节点最后活跃时间（相对时间）
- 响应式卡片布局，适配桌面和移动设备
- 遵循内部前端规范（CSS 变量、语义化 HTML、无框架）

## 文件结构

- `index.html` - 主页面
- `styles.css` - 样式文件（使用 CSS Grid 和自定义属性）
- `script.js` - 节点数据渲染逻辑（当前使用模拟数据）
- `README.md` - 项目说明

## 运行方式

直接在浏览器中打开 `index.html` 即可查看效果。

> 注意：当前使用的是模拟数据。如需连接真实后端 API，可在 `script.js` 中将 `mockNodes` 替换为 `fetch('/api/nodes')` 调用。