#!/bin/bash

set -e

echo "Starting BoincHub deployment..."
echo "Using database URL: ${BOINCHUB_DATABASE_URL}"

# Run database migrations
echo "Running database migrations..."
cd /app
uv run alembic upgrade head

# Start the application
echo "Starting the application..."
uv run boinchub
