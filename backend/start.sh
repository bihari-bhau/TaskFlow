#!/bin/bash
# Railway startup script
# Railway injects $PORT at runtime — must use a shell script so
# the variable gets expanded before uvicorn receives it.
# Without this, railway.toml's startCommand passes the literal
# string "$PORT" to uvicorn which crashes with "not a valid integer".

PORT=${PORT:-8000}

echo "Starting TaskFlow API on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"