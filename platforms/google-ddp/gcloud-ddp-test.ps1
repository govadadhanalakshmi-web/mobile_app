# ==============================================================================
# Google Cloud Developer Device Platform (DDP) / Firebase Test Lab CLI
# Uses Spark Free Quota (5 Real / 10 Virtual Daily) or $300 GCP Credits
# ==============================================================================

param (
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "todomaster-mobile-e2e",

    [Parameter(Mandatory=$false)]
    [string]$ApkPath = ".\firebase\TodoMaster-Release.apk",

    [Parameter(Mandatory=$false)]
    [string]$RoboScript = ".\firebase\firebase-robo-script.json"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Google Cloud DDP / Firebase Test Lab Automated Run" -ForegroundColor Green
Write-Host "Target APK: $ApkPath" -ForegroundColor Yellow
Write-Host "Robo Script: $RoboScript (71 Test Actions)" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $ApkPath)) {
    Write-Error "APK file not found at $ApkPath"
    exit 1
}

Write-Host "`n[Step 1] Checking Google Cloud SDK (gcloud)..." -ForegroundColor Cyan
try {
    $gcloudVer = & gcloud --version 2>&1
    Write-Host "gcloud is available: $($gcloudVer[0])" -ForegroundColor Green

    Write-Host "`n[Step 2] Triggering Test Matrix on Google Cloud Devices..." -ForegroundColor Cyan
    $cmd = "gcloud firebase test android run --type robo --app '$ApkPath' --robo-script '$RoboScript' --device model=panther,version=33,locale=en,orientation=portrait --timeout 5m"
    Write-Host "Executing: $cmd" -ForegroundColor Yellow
    Invoke-Expression $cmd
} catch {
    Write-Host "gcloud SDK not logged in or quota exhausted for today." -ForegroundColor Yellow
    Write-Host "Daily Reset Time: 12:30 PM - 1:30 PM IST (Midnight PST)." -ForegroundColor Magenta
    Write-Host "`nManual Firebase Console Upload Steps:" -ForegroundColor Cyan
    Write-Host "1. Open https://console.firebase.google.com/project/_/testlab" -ForegroundColor White
    Write-Host "2. Drag and drop '$ApkPath'" -ForegroundColor White
    Write-Host "3. In Robo Script section, upload '$RoboScript'" -ForegroundColor White
    Write-Host "4. Select Pixel 7 / Samsung Galaxy S22" -ForegroundColor White
    Write-Host "5. Click 'Start Test'" -ForegroundColor Green
}

