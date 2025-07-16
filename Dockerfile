# Frontend build stage
FROM node:22.17.0-alpine@sha256:fc3e945f920b7e3000cd1af86c4ae406ec70c72f328b667baf0f3a8910d69eed AS frontend-builder
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Copy source files and build
COPY frontend/ ./
ENV NODE_ENV=production
RUN pnpm build

# Backend stage
FROM python:3.13-alpine3.22@sha256:9b4929a72599b6c6389ece4ecbf415fd1355129f22bb92bb137eea098f05e975 AS backend
COPY --from=ghcr.io/astral-sh/uv:latest@sha256:2363bcbe837b6ca8fda6512a4a68de3bc752035797c159ca0ecb68c27a0d0368 /uv /uvx /bin/

# Install system dependencies
RUN apk add --no-cache \
    bash \
    build-base \
    libffi-dev \
    musl-dev \
    python3-dev \
    postgresql-dev

# Change working directory
WORKDIR /app

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Install Python dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=backend/uv.lock,target=uv.lock \
    --mount=type=bind,source=backend/pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Copy the project into the image
ADD backend/ /app

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

# Copy build frontend assets
COPY --from=frontend-builder /app/frontend/dist ./static

# Copy startup script
COPY docker-entrypoint.sh .
RUN chmod +x ./docker-entrypoint.sh

# Expose port
EXPOSE 8000

# Use entrypoint script to run migrations and start server
ENTRYPOINT ["./docker-entrypoint.sh"]



