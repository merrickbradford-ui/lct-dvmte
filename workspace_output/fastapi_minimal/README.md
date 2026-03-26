# FastAPI Minimal Project

A minimal FastAPI project structure following best practices.

## Setup

1. Ensure you have Python 3.13 and uv installed
2. Install dependencies: `uv sync`
3. Run the application: `uv run fastapi dev app/main.py`

## Project Structure

- `app/main.py`: Main application entry point
- `app/routers/`: API route handlers
- `app/services/`: Business logic services
- `pyproject.toml`: Project dependencies and metadata

## Features

- Type hints on all endpoints
- Proper separation of concerns (routers vs services)
- PEP 8 compliant code
- Uses uv for dependency management