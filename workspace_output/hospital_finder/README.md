# Hospital Finder Web Application

这是一个基于 OpenStreetMap 数据的附近医院查找器 Web 应用，使用 FastAPI 后端和 Leaflet.js 前端。

## 功能特性

- 📍 获取用户当前位置（通过浏览器地理定位 API）
- 🏥 显示附近医院在地图上的位置
- 📋 列出医院详细信息（名称、地址、电话、急诊服务等）
- 📏 显示医院与用户位置的距离
- 🌐 响应式设计，支持移动设备

## 技术栈

- **后端**: Python 3.13 + FastAPI + uv
- **前端**: HTML5 + CSS3 + Vanilla JavaScript + Leaflet.js
- **数据源**: OpenStreetMap Overpass API
- **地图**: OpenStreetMap tiles via Leaflet

## 项目结构

```
hospital_finder/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI 应用入口
│   └── routers/
│       ├── hospitals.py # 医院 API 路由
│       └── hotels.py    # 酒店 API 路由
├── static/
│   └── index.html       # 主页面
├── pyproject.toml       # 依赖管理
└── README.md
```

## 环境设置

### 先决条件

- Python 3.13
- [uv](https://docs.astral.sh/uv/) 包管理器

### 安装步骤

1. 克隆或下载此项目
2. 在项目根目录下运行：

```bash
uv sync
```

3. 启动开发服务器：

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 访问应用

- API 文档: http://localhost:8000/docs
- Web 界面: http://localhost:8000/static/index.html

## API 端点

### 获取附近医院
```
GET /api/hospitals/?lat={latitude}&lon={longitude}&radius={meters}
```

### 获取附近酒店  
```
GET /api/hotels/?lat={latitude}&lon={longitude}&radius={meters}
```

## 注意事项

- 地理定位功能需要在 HTTPS 或 localhost 环境下工作
- OpenStreetMap 数据的完整性和准确性取决于社区贡献
- 默认搜索半径为 5000 米（5 公里）
- 应用遵循内部设计规范：主色调为 `#2F4F4F`（Dark Slate Gray）

## 许可证

此项目使用 OpenStreetMap 数据，遵循 [ODbL 许可证](https://opendatacommons.org/licenses/odbl/)。