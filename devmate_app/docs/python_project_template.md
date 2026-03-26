# Python Project Template Guidelines

## 1. Project Initialization
All new Python projects must be initialized with `uv`.
Use `pyproject.toml` as the only dependency manifest.
Never generate `requirements.txt`.

## 2. Required Layout
A generated Python web project should follow this structure:
- `pyproject.toml`
- `README.md`
- `app/__init__.py`
- `app/main.py`
- `app/routers/`
- `app/services/`
- `static/`
- `templates/`

## 3. FastAPI Rules
- Route handlers live in `routers/` only.
- Business logic lives in `services/` only.
- Use type hints on every endpoint.
- Prefer dependency injection for auth and shared services.

## 4. Documentation Rules
Every generated project must include a README with:
- environment setup
- `uv sync`
- run command
- project structure summary

## 5. Logging and Quality
- Never use `print()`.
- Use `logging`.
- Follow PEP 8 strictly.
- Target Python 3.13.
