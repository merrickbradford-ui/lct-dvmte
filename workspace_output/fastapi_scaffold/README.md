# FastAPI Scaffold

A tiny FastAPI project scaffold built with Python 3.13 and uv.

## Environment Setup

1. Ensure you have Python 3.13 installed
2. Install uv: `pip install uv`

## Installation

```bash
uv sync
```

## Running the Application

```bash
uv run fastapi dev app/main.py
```

Or for production:

```bash
uv run fastapi run app/main.py
```

## Endpoints

- `GET /` - Returns a welcome message
- `GET /health` - Health check endpoint that returns {"status": "healthy"}

## Project Structure

- `pyproject.toml`: Project dependencies and metadata
- `app/`: Main application package
  - `main.py`: Application entry point
  - `routers/`: API route handlers
    - `health.py`: Health check endpoint
  - `services/`: Business logic layer
- `README.md`: This file