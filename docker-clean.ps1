# TaskFlow — Clean Docker Reset (PowerShell)
Write-Host ""
Write-Host "╔══════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TaskFlow — Clean Docker Reset              ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Stopping all TaskFlow containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "[2/5] Removing TaskFlow images..." -ForegroundColor Yellow
docker rmi taskflow-backend taskflow-frontend 2>$null
docker rmi taskflow_backend taskflow_frontend 2>$null

Write-Host ""
Write-Host "[3/5] Removing database volume (ALL DATA DELETED)..." -ForegroundColor Red
docker volume rm taskflow_pgdata 2>$null

Write-Host ""
Write-Host "[4/5] Removing dangling images..." -ForegroundColor Yellow
docker image prune -f

Write-Host ""
Write-Host "[5/5] Removing unused networks..." -ForegroundColor Yellow
docker network prune -f

Write-Host ""
Write-Host "✅ Clean complete! Ready for fresh build." -ForegroundColor Green
Write-Host ""
Write-Host "Run this to start fresh:" -ForegroundColor White
Write-Host "  docker-compose up --build" -ForegroundColor Cyan
Write-Host ""
