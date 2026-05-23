# Frontend build stage
FROM node:25.9.0-alpine@sha256:bdf2cca6fe3dabd014ea60163eca3f0f7015fbd5c7ee1b0e9ccb4ced6eb02ef4 AS frontend-builder
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN npm install corepack --global --force && corepack enable && pnpm install --frozen-lockfile

# Copy source files and build
COPY frontend/ ./
ENV NODE_ENV=production
RUN pnpm build

# Backend build stage
FROM python:3.14.5-alpine3.23@sha256:5a824eb82cc75361f98611f3cfc5091ea33f10a6ccea4d4ebdabbc523b9a1614 AS backend-builder
COPY --from=ghcr.io/astral-sh/uv:0.11.14@sha256:1025398289b62de8269e70c45b91ffa37c373f38118d7da036fb8bb8efc85d97 /uv /uvx /bin/

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
FROM python:3.14.5-alpine3.23@sha256:5a824eb82cc75361f98611f3cfc5091ea33f10a6ccea4d4ebdabbc523b9a1614

# uv is needed at runtime for the entrypoint script
COPY --from=ghcr.io/astral-sh/uv:0.11.14@sha256:1025398289b62de8269e70c45b91ffa37c373f38118d7da036fb8bb8efc85d97 /uv /uvx /bin/

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
