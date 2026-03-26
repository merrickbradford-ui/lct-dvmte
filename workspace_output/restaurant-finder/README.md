# 附近餐厅查找器

这是一个简单的网页应用，用于展示附近的餐厅位置。

## 功能特点

- 使用 Leaflet.js 和 OpenStreetMap 显示交互式地图
- 支持获取用户当前位置
- 展示附近的餐厅列表和标记
- 响应式设计，支持移动设备

## 技术栈

- HTML5
- CSS3 (使用 CSS 变量和 Flexbox)
- JavaScript (ES6+)
- Leaflet.js 1.9.4
- OpenStreetMap

## 如何使用

1. 在浏览器中打开 `index.html` 文件
2. 点击"定位我的位置"按钮获取当前位置（需要允许位置权限）
3. 点击"搜索附近餐厅"按钮查看附近的餐厅

## 注意事项

- 本演示使用模拟的餐厅数据
- 在实际应用中，餐厅数据应从后端 API 获取（如 Google Places API、高德地图 API 等）
- 请确保在支持地理位置 API 的现代浏览器中使用

## 自定义

要自定义此应用：

1. 修改 `mockRestaurants` 数组中的餐厅数据
2. 调整 CSS 变量以更改主题颜色
3. 集成真实的餐厅 API 替换模拟数据

## 浏览器兼容性

- Chrome
- Firefox
- Safari
- Edge

需要支持 Geolocation API 和现代 JavaScript 特性。