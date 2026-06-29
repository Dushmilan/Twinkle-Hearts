# ============================================
# Twinkle-Hearts: Full Cloudflare Deploy Script
# Run this from the repo root directory
# ============================================

$ErrorActionPreference = "Stop"
$BACKEND = "$PSScriptRoot\backend"
$FRONTEND = "$PSScriptRoot\frontend"

Write-Host "=== LOGIN TO CLOUDFLARE ===" -ForegroundColor Cyan
Write-Host "Run this first, follow the browser prompt, then re-run this script" -ForegroundColor Yellow
npx wrangler login --browser false

Write-Host "`n=== CREATE D1 DATABASE ===" -ForegroundColor Cyan
npx wrangler d1 create twinkle-hearts-db 2>&1 | Tee-Object -Variable d1Output
$D1_ID = ($d1Output | Select-String -Pattern "database_id = ""(.*?)""" | ForEach-Object { $_.Matches.Groups[1].Value })

if (-not $D1_ID) {
    Write-Host "Could not extract D1 ID. Please run 'npx wrangler d1 create twinkle-hearts-db' manually and paste the ID." -ForegroundColor Red
    exit 1
}
Write-Host "D1 ID: $D1_ID" -ForegroundColor Green

Write-Host "`n=== CREATE KV NAMESPACE ===" -ForegroundColor Cyan
npx wrangler kv namespace create "TWINKLE-HEARTS-CACHE" 2>&1 | Tee-Object -Variable kvOutput
$KV_ID = ($kvOutput | Select-String -Pattern "id = ""(.*?)""" | ForEach-Object { $_.Matches.Groups[1].Value })

if (-not $KV_ID) {
    Write-Host "Could not extract KV ID. Please run 'npx wrangler kv namespace create TWINKLE-HEARTS-CACHE' manually." -ForegroundColor Red
    exit 1
}
Write-Host "KV ID: $KV_ID" -ForegroundColor Green

Write-Host "`n=== CREATE R2 BUCKET ===" -ForegroundColor Cyan
npx wrangler r2 bucket create twinkle-hearts-images

Write-Host "`n=== GENERATE JWT KEYS ===" -ForegroundColor Cyan
openssl genrsa -out "$BACKEND\jwtRS256.key" 2048
openssl rsa -in "$BACKEND\jwtRS256.key" -pubout -out "$BACKEND\jwtRS256.key.pub"
Write-Host "JWT keys generated" -ForegroundColor Green

Write-Host "`n=== WRITE WRANGLER.TOML ===" -ForegroundColor Cyan
@"
name = "twinkle-hearts-api"
main = "src/worker.ts"
compatibility_date = "2025-12-01"
compatibility_flags = ["nodejs_compat"]

routes = [
  { pattern = "api.twinklehearts.com/*", custom_domain = true }
]

[[d1_databases]]
binding = "DB"
database_name = "twinkle-hearts-db"
database_id = "$D1_ID"

[[kv_namespaces]]
binding = "KV"
id = "$KV_ID"

[[r2_buckets]]
binding = "R2"
bucket_name = "twinkle-hearts-images"

[vars]
NODE_ENV = "production"
JWT_EXPIRES_IN = "7d"
REFRESH_TOKEN_EXPIRES_IN = "30d"
TAX_RATE = "0.18"
CORS_ORIGIN = "https://app.twinklehearts.com"

[observability]
enabled = true
"@ | Set-Content -Path "$BACKEND\wrangler.toml" -Encoding UTF8
Write-Host "wrangler.toml written with D1 database_id and KV id" -ForegroundColor Green

Write-Host "`n=== APPLY D1 MIGRATIONS ===" -ForegroundColor Cyan
Push-Location $BACKEND
npx wrangler d1 migrations apply twinkle-hearts-db
Pop-Location

Write-Host "`n=== GENERATE PRISMA CLIENT ===" -ForegroundColor Cyan
Push-Location $BACKEND
npx prisma generate
Pop-Location

Write-Host "`n=== SET SECRETS ===" -ForegroundColor Yellow
Write-Host "You need to set secrets via 'wrangler secret put'. Run these commands:"
Write-Host ""
$jwtPrivate = Get-Content "$BACKEND\jwtRS256.key" -Raw
$jwtPublic = Get-Content "$BACKEND\jwtRS256.key.pub" -Raw

Push-Location $BACKEND
# Set JWT keys
$jwtPrivate | npx wrangler secret put JWT_PRIVATE_KEY
Pop-Location

Push-Location $BACKEND
$jwtPublic | npx wrangler secret put JWT_PUBLIC_KEY
Pop-Location

Write-Host ""
Write-Host "Also set these secrets (replace with your values):" -ForegroundColor Yellow
Write-Host "  npx wrangler secret put GOOGLE_CLIENT_ID" -ForegroundColor Gray
Write-Host "  npx wrangler secret put WHATSAPP_BUSINESS_ACCESS_TOKEN" -ForegroundColor Gray
Write-Host "  npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID" -ForegroundColor Gray
Write-Host "  npx wrangler secret put WHATSAPP_BUSINESS_NUMBER" -ForegroundColor Gray
Write-Host "  npx wrangler secret put RESEND_API_KEY" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to continue with deployment..."

Write-Host "`n=== DEPLOY BACKEND WORKER ===" -ForegroundColor Cyan
Push-Location $BACKEND
npx wrangler deploy
Pop-Location

Write-Host "`n=== DEPLOY FRONTEND (PAGES) ===" -ForegroundColor Cyan
Push-Location $FRONTEND
npm run build
npx wrangler pages deploy dist --project-name twinkle-hearts
Pop-Location

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Set up custom domain for Pages (app.twinklehearts.com)" -ForegroundColor White
Write-Host "  2. Set up custom domain for Worker (api.twinklehearts.com)" -ForegroundColor White
Write-Host "  3. Update CORS_ORIGIN in wrangler.toml: CORS_ORIGIN = 'https://app.twinklehearts.com'" -ForegroundColor White
Write-Host "  4. Deploy again after updating: npx wrangler deploy" -ForegroundColor White
