#!/bin/sh
set -e

echo "Starting Field Service Manager Backend..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
MAX_TRIES=30
COUNT=0
while ! nc -z postgres 5432; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $MAX_TRIES ]; then
    echo "PostgreSQL did not become ready in time"
    exit 1
  fi
  echo "Waiting for PostgreSQL... ($COUNT/$MAX_TRIES)"
  sleep 2
done
echo "PostgreSQL is ready!"

# Run Prisma migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Check if AUTO_SEED environment variable is set
# By default, seed on development environment
if [ "${AUTO_SEED}" = "false" ]; then
  echo "AUTO_SEED is disabled. Skipping database seed."
elif [ "${NODE_ENV}" = "development" ] || [ "${AUTO_SEED}" = "true" ]; then
  echo "Running database seed script..."
  npm run db:seed || echo "Seed script failed or data already exists"
else
  echo "Skipping seed (not in development mode)"
fi

# Start the application
echo "Starting application..."
exec "$@"
