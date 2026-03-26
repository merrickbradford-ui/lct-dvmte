FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

COPY config.toml config.docker.toml README.md ./
COPY mcp_server ./mcp_server
COPY devmate_app ./devmate_app

RUN cd /app/mcp_server && uv sync
RUN cd /app/devmate_app && uv sync

CMD ["uv", "run", "--project", "/app/devmate_app", "devmate-web"]
