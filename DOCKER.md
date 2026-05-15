# TaskFlow — Docker Setup Guide

Everything runs in Docker — PostgreSQL, FastAPI backend, React frontend.
No Supabase, no Railway, no external services needed.

---

## Prerequisites

Install **Docker Desktop** for Windows:
→ https://www.docker.com/products/docker-desktop/

After installing, make sure Docker Desktop is **running** (whale icon in taskbar).

---

## Quick Start (First Time)

Open PowerShell in the `taskflow` folder:

```powershell
# Start everything (builds images + starts containers)
docker-compose up --build
```

Wait ~3-5 minutes for first build. You'll see:

```
taskflow_db       | database system is ready to accept connections
taskflow_backend  | ✅ PostgreSQL is ready!
taskflow_backend  | ✅ Seed complete! Demo accounts ready
taskflow_backend  | INFO: Application startup complete.
taskflow_frontend | nginx: the configuration file ...syntax is ok
```

Then open:
- **App:**      http://localhost:3000
- **API:**      http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## Demo Login Credentials

| Role   | Email                  | Password   |
|--------|------------------------|------------|
| Admin  | admin@taskflow.com     | admin123   |
| Member | member@taskflow.com    | member123  |
| Member | dev@taskflow.com       | dev123     |

---

## Daily Use Commands

```powershell
# Start (after first build — much faster)
docker-compose up

# Start in background (no logs in terminal)
docker-compose up -d

# Stop containers (keeps data)
docker-compose down

# View live logs
docker-compose logs -f

# View logs for one service only
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

---

## Clean Reset — Delete Everything and Start Fresh

### Option A — PowerShell Script (Easiest)
```powershell
.\docker-clean.ps1
docker-compose up --build
```

### Option B — Batch File
Double-click `docker-clean.bat`, then run:
```powershell
docker-compose up --build
```

### Option C — Manual Commands (step by step)

```powershell
# Step 1: Stop and remove containers
docker-compose down

# Step 2: Remove TaskFlow images (forces full rebuild)
docker rmi taskflow-backend taskflow-frontend

# Step 3: Delete the database volume (ALL DATA GONE)
docker volume rm taskflow_pgdata

# Step 4: Remove leftover dangling images
docker image prune -f

# Step 5: Fresh build and start
docker-compose up --build
```

---

## Nuclear Option — Remove ALL Docker Data

Only use this if you want to wipe everything Docker-related on your machine:

```powershell
# Stop all running containers
docker stop $(docker ps -aq)

# Remove ALL containers
docker rm $(docker ps -aq)

# Remove ALL images
docker rmi $(docker images -q) -f

# Remove ALL volumes
docker volume prune -f

# Remove ALL networks
docker network prune -f

# Then rebuild TaskFlow
docker-compose up --build
```

---

## Disable Auto-Seed (Demo Data)

By default, demo users + tasks are created on first start.
To disable, edit `docker-compose.yml` and change:

```yaml
SEED_DB: "false"    # was "true"
```

Then clean and rebuild:
```powershell
docker-compose down -v
docker-compose up --build
```

---

## Common Issues

### "Port already in use"
Another app is using port 3000 or 8000.
```powershell
# Change ports in docker-compose.yml:
ports:
  - "3001:80"     # frontend on 3001
  - "8001:8000"   # backend on 8001
```

### "Docker not found" / "Cannot connect to Docker"
Docker Desktop is not running. Open it from the Start menu and wait for the whale icon to appear in the taskbar.

### Backend keeps restarting
Check logs:
```powershell
docker-compose logs backend
```
Usually means the database isn't ready yet — wait 30 seconds and it will self-recover.

### Frontend shows blank page
```powershell
docker-compose logs frontend
```
If nginx shows errors, do a clean rebuild:
```powershell
docker-compose down && docker-compose up --build
```

### Changes not reflected after editing code
The backend auto-reloads on file save (volume mounted).
The frontend needs a rebuild:
```powershell
docker-compose up --build frontend
```

---

## Folder Structure in Docker

```
localhost:3000  →  frontend (nginx serving React build)
    ↓ API calls to
localhost:8000  →  backend (FastAPI + uvicorn)
    ↓ connects to
localhost:5432  →  db (PostgreSQL 15)
    ↓ data stored in
Docker Volume: taskflow_pgdata
```

---

## Check Running Containers

```powershell
docker ps
```

Should show 3 containers:

```
CONTAINER ID   IMAGE               STATUS         PORTS
xxxxxxxxxxxx   taskflow-frontend   Up 2 minutes   0.0.0.0:3000->80/tcp
xxxxxxxxxxxx   taskflow-backend    Up 2 minutes   0.0.0.0:8000->8000/tcp
xxxxxxxxxxxx   postgres:15-alpine  Up 2 minutes   0.0.0.0:5432->5432/tcp
```
