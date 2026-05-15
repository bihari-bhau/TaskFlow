#!/bin/bash
# Wait for PostgreSQL to be ready before starting the app
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."

until python -c "
import os, psycopg2, sys
try:
    url = os.environ.get('DATABASE_URL', '')
    if 'postgresql' in url or 'postgres' in url:
        psycopg2.connect(url)
        print('✅ PostgreSQL is ready!')
    else:
        print('✅ Using SQLite, skipping wait.')
    sys.exit(0)
except Exception as e:
    print(f'Not ready yet: {e}')
    sys.exit(1)
"; do
    sleep 2
done

# Auto-seed if SEED_DB=true
if [ "$SEED_DB" = "true" ]; then
    echo "🌱 Running seed script..."
    python seed.py
fi

# Start the app
exec uvicorn main:app --host 0.0.0.0 --port 8000
