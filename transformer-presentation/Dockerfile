# --- Build the React frontend -------------------------------------------------
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# --- Python runtime: FastAPI serves the API, WebSockets and the built frontend --
FROM python:3.13-slim
WORKDIR /app/backend
# requirements.txt is exported from uv.lock (`uv export --no-dev --no-hashes`), so versions match local dev
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY --from=frontend /app/frontend/dist /app/frontend/dist

ENV FRONTEND_DIST=/app/frontend/dist \
    DB_PATH=/data/presentation.db \
    PYTHONUNBUFFERED=1
RUN mkdir -p /data
EXPOSE 8000
# Render (and most PaaS hosts) inject $PORT; fall back to 8000 locally.
# Single worker on purpose: live presentation state and WebSocket connections live in this process.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1 --proxy-headers --forwarded-allow-ips='*'"]
