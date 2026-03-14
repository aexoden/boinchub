# Frontend build stage
FROM node:24.13.1-alpine@sha256:4f696fbf39f383c1e486030ba6b289a5d9af541642fc78ab197e584a113b9c03 AS frontend-builder
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source files and build
COPY frontend/ ./
ENV NODE_ENV=production
RUN pnpm build

# Backend build stage
FROM python:3.14-alpine3.22@sha256:b0d9cd5ed77285b2563c86ca10b53578249ca1a08d14e5b69b7970884a9fb539 AS backend-builder
COPY --from=ghcr.io/astral-sh/uv:latest@sha256:cbe0a44ba994e327b8fe7ed72beef1aaa7d2c4c795fd406d1dbf328bacb2f1c5 /uv /uvx /bin/

# Install build-time system dependencies for compiling native extensions
RUN apk add --no-cache \
    build-base \
    libffi-dev \
    musl-dev \
    python3-dev \
    postgresql-dev

WORKDIR /app

# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Install Python dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --locked --no-install-project

# Copy the project into the image and sync
COPY --exclude=frontend . /app
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

# Runtime stage
FROM python:3.14-alpine3.22@sha256:b0d9cd5ed77285b2563c86ca10b53578249ca1a08d14e5b69b7970884a9fb539

# uv is needed at runtime for the entrypoint script
COPY --from=ghcr.io/astral-sh/uv:latest@sha256:cbe0a44ba994e327b8fe7ed72beef1aaa7d2c4c795fd406d1dbf328bacb2f1c5 /uv /uvx /bin/

# Install only runtime system dependencies
RUN apk add --no-cache \
    bash \
    libffi \
    libgcc \
    libpq

# Run as non-root user
RUN addgroup -S boinchub && adduser -S boinchub -G boinchub

WORKDIR /app

# Copy built application from builder
COPY --from=backend-builder --chown=boinchub:boinchub /app /app

# Copy built frontend assets
COPY --from=frontend-builder --chown=boinchub:boinchub /app/frontend/dist ./static

# Copy entrypoint script
COPY --chmod=755 --chown=boinchub:boinchub docker-entrypoint.sh .

USER boinchub

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
