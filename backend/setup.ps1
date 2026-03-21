# Twinkle-Hearts Backend Setup Script
# Private Commercial Project - Confidential

Write-Host "=== Twinkle-Hearts Backend Setup ===" -ForegroundColor Cyan

# Check if running in correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "Error: Please run this script from the backend directory" -ForegroundColor Red
    exit 1
}

Write-Host "`n[1/4] Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "`n[2/4] Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate

Write-Host "`n[3/4] Checking JWT keys..." -ForegroundColor Yellow
if (-not (Test-Path "jwtRS256.key")) {
    Write-Host "JWT keys not found. The app will auto-generate temporary keys on first run." -ForegroundColor Yellow
    Write-Host "For production, generate keys with:" -ForegroundColor Yellow
    Write-Host "  ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key" -ForegroundColor Gray
} else {
    Write-Host "JWT keys found." -ForegroundColor Green
}

Write-Host "`n[4/4] Setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Start Redis: docker-compose up -d redis" -ForegroundColor White
Write-Host "  2. Start database: docker-compose up -d postgres" -ForegroundColor White
Write-Host "  3. Run migrations: npm run db:migrate" -ForegroundColor White
Write-Host "  4. Start dev server: npm run dev" -ForegroundColor White
