# TraceTest 官网静态页面

这是一个展示 [TraceTest](https://tracetest.io/) 开源项目的静态官网页面，突出其基于分布式追踪的测试能力。

## 功能亮点

- 响应式设计，适配桌面与移动设备
- 平滑滚动导航
- 现代化 UI 卡片布局
- 符合语义化的 HTML 结构

## 项目结构

```
tracetest-landing/
├── index.html       # 主页面
├── styles.css       # 样式文件
├── script.js        # 交互逻辑（平滑滚动等）
└── README.md        # 本说明文件
```

## 如何运行

1. 克隆或下载本项目
2. 在浏览器中直接打开 `index.html` 文件即可查看

无需任何构建步骤或服务器，纯静态页面。

## 关于 TraceTest

TraceTest 是一个开源的、基于分布式追踪的测试工具，允许开发者利用 OpenTelemetry trace 数据快速创建集成测试和端到端测试。它支持与现有可观测性后端（如 Jaeger、Tempo）集成，并可通过 CLI 融入 CI/CD 流程。