---
name: web-project-generator
description: Generate runnable web projects with minimal architecture and clear run steps. Use when the user asks to build or modify websites, landing pages, frontend projects, or FastAPI web apps.
---

# Web Project Generator

## When to use
- User asks to create or improve a website/web app.
- User needs runnable output with previewable files.

## Execution checklist
1. Clarify if static frontend is enough; only add backend when request needs server behavior.
2. Prefer minimal file set and clear structure.
3. Write complete file content, not partial patches, when generating new files.
4. Keep project runnable immediately.
5. Return concise Chinese summary with key files and run steps.

## Output standards
- Static projects: `index.html`, `styles.css`, `script.js`, optional `README.md`.
- FastAPI projects: `pyproject.toml`, `app/main.py`, router structure, and run command with `uv`.
- Avoid unnecessary abstractions and over-engineering.
