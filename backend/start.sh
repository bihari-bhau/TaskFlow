PORT=${PORT:-8000}
echo "Seeding database..."
python seed.py
echo "Starting TaskFlow API on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"