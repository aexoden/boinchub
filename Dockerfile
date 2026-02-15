# Frontend build stage
FROM node:22.21.0-alpine@sha256:bd26af08779f746650d95a2e4d653b0fd3c8030c44284b6b98d701c9b5eb66b9 AS frontend-builder
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile

# Copy source files and build
COPY frontend/ ./
ENV NODE_ENV=production
RUN pnpm build

# Backend stage
FROM python:3.13-alpine3.22@sha256:e5fa639e49b85986c4481e28faa2564b45aa8021413f31026c3856e5911618b1 AS backend
COPY --from=ghcr.io/astral-sh/uv:latest@sha256:f459f6f73a8c4ef5d69f4e6fbbdb8af751d6fa40ec34b39a1ab469acd6e289b7 /uv /uvx /bin/

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
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Copy the project into the image
COPY --exclude=frontend . /app

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
