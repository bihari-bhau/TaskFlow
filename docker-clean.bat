@echo off
echo.
echo ╔══════════════════════════════════════════════╗
echo ║   TaskFlow — Clean Docker Reset (Windows)   ║
echo ╚══════════════════════════════════════════════╝
echo.

echo [1/4] Stopping and removing containers...
docker-compose down

echo.
echo [2/4] Removing TaskFlow Docker images...
docker rmi taskflow-backend taskflow-frontend 2>nul
docker rmi taskflow_backend taskflow_frontend 2>nul

echo.
echo [3/4] Removing database volume (ALL DATA DELETED)...
docker volume rm taskflow_pgdata 2>nul

echo.
echo [4/4] Removing dangling/unused images...
docker image prune -f

echo.
echo ✅ Clean complete! All TaskFlow containers, images and data removed.
echo.
echo Now run:  docker-compose up --build
echo.
pause
