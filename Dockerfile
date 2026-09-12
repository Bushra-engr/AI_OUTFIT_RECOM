# ==========================================
# STAGE 1: Build React Frontend
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/react

COPY react/package*.json ./
RUN npm ci

COPY react/ ./
RUN npm run build

# ==========================================
# STAGE 2: Python Backend Runtime
# ==========================================
FROM python:3.11-slim AS backend-runtime

WORKDIR /app

# Install system dependencies needed for image processing (rembg, pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Pre-download u2net model for rembg so uploads are fast on first use
RUN python -c "from rembg import new_session; new_session('u2net')"

# Copy backend code
COPY backend/ ./backend

# Copy built frontend static assets into backend/static
COPY --from=frontend-builder /app/backend/static ./backend/static

EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV PORT=8000

CMD ["sh", "-c", "uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port \"]
