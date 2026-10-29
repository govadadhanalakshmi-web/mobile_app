# ==============================================================================
# Firebase Test Lab Execution Script for Windows PowerShell
# ==============================================================================

$APK_PATH = ".\firebase\TodoMaster-Release.apk"
$ROBO_SCRIPT = ".\firebase\firebase-robo-script.json"

if (-not (Test-Path $APK_PATH)) {
    Write-Error "APK file not found at $APK_PATH"
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Triggering Firebase Test Lab Robo Cloud Testing" -ForegroundColor Green
Write-Host "APK: $APK_PATH" -ForegroundColor Yellow
Write-Host "Robo Script JSON: $ROBO_SCRIPT" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

gcloud firebase test android run `
  --type robo `
  --app "$APK_PATH" `
  --robo-script "$ROBO_SCRIPT" `
  --device model=panther,version=33,locale=en,orientation=portrait `
  --device model=oriole,version=31,locale=en,orientation=portrait `
  --device model=dm3q,version=33,locale=en,orientation=portrait `
  --device model=Pixel2,version=30,locale=en,orientation=portrait `
  --timeout 3m

Write-Host "Firebase Test Lab execution finished." -ForegroundColor Green
