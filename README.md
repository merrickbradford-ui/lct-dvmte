# DevMate

## 项目描述

DevMate 是一个基于 Python 的智能开发助手项目，采用 Monorepo 结构，包含两个子项目：

- `devmate_app`：主应用，负责对话代理、RAG 检索、技能复用以及 Web UI。
- `mcp_server`：独立的 MCP 服务，负责提供基于 Tavily 的网络搜索能力。

项目支持本地运行，也支持通过 Docker 启动。

## 项目环境

- Python `3.13`
- 依赖管理工具：`uv`
- Docker
- Docker Compose

配置文件说明：

- `config.example.toml`：配置模板
- `config.toml`：本地运行配置
- `config.docker.toml`：Docker 运行配置

在启动项目之前，请先确认以下 `api_key` 都已正确填写：

- `config.toml` / `config.docker.toml` 中的各类 `api_key`
- `docker-compose.yml` 中 `app.environment` 下的 `LANGCHAIN_API_KEY`

## 项目如何启动

### 方式一：本地启动

#### 1. 启动 MCP Server

```powershell
uv sync --project mcp_server
uv run --project mcp_server devmate-mcp-server --host 127.0.0.1 --port 9000 --mount-path /mcp
```

#### 2. 启动 DevMate App

```powershell
uv sync --project devmate_app
uv run --project devmate_app devmate-ingest
$env:DEVMATE_WEB_PORT="8080"
uv run --project devmate_app devmate-web
```

#### 3. 浏览器访问

```text
http://127.0.0.1:8080
```

### 方式二：Docker 启动

```powershell
docker compose up --build
```

#### 浏览器访问

```text
http://127.0.0.1:8080
```
