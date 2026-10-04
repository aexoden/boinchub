# Frontend build stage
FROM ghcr.io/pnpm/pnpm:12.9.1@sha256:77123fd40a39db0eb8be6bddfcf0cea15e000122b9221ccce2e4415be29050f2 AS frontend-builder
WORKDIR /app/frontend

# Copy package files and install dependencies
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source files and build
COPY frontend/ ./
ENV NODE_ENV=production
RUN pnpm build

# Backend build stage
FROM python:3.14.7-alpine3.23@sha256:218761489de417a6eb0808e264cbdd7043ec6659fe5a61898815e9848536541d AS backend-builder
COPY --from=ghcr.io/astral-sh/uv:0.12.5@sha256:e85be844203885286c60ffad8a858d48afb6c5a5c237ca0e67f12e74b8f174b1 /uv /uvx /bin/

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
FROM python:3.14.7-alpine3.23@sha256:218761489de417a6eb0808e264cbdd7043ec6659fe5a61898815e9848536541d

# uv is needed at runtime for the entrypoint script
COPY --from=ghcr.io/astral-sh/uv:0.12.5@sha256:e85be844203885286c60ffad8a858d48afb6c5a5c237ca0e67f12e74b8f174b1 /uv /uvx /bin/

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
