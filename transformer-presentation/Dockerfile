# --- Build the React frontend -------------------------------------------------
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Python runtime: FastAPI serves the API, WebSockets and the built frontend --
FROM python:3.13-slim
COPY --from=ghcr.io/astral-sh/uv:0.5.11 /uv /usr/local/bin/uv
WORKDIR /app/backend
COPY backend/pyproject.toml ./
RUN uv sync --no-dev --no-install-project
COPY backend/app ./app
COPY --from=frontend /app/frontend/dist /app/frontend/dist

ENV FRONTEND_DIST=/app/frontend/dist \
    DB_PATH=/data/presentation.db \
    PRESENTER_KEY=change-me
VOLUME /data
EXPOSE 8000
# Single worker on purpose: live presentation state and WebSocket connections live in this process.
CMD ["uv", "run", "--no-dev", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
