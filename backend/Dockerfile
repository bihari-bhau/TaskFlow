FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App source
COPY . .

# Make both scripts executable
RUN chmod +x wait-for-db.sh start.sh

EXPOSE 8000

# Default CMD is for docker-compose (waits for local Postgres).
# On Railway, this is overridden by railway.toml's startCommand = "bash start.sh"
CMD ["bash", "wait-for-db.sh"]