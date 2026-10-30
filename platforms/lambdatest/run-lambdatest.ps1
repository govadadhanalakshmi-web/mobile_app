# ==============================================================================
# LambdaTest App Automation Cloud - Automated Real Physical Device Test
# Lifetime Free Tier: 100 Minutes / Month Renewing Perpetually
# ==============================================================================

param (
    [Parameter(Mandatory=$false)]
    [string]$Username,

    [Parameter(Mandatory=$false)]
    [string]$AccessKey,

    [Parameter(Mandatory=$false)]
    [string]$ApkPath = ".\firebase\TodoMaster-Release.apk"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "LambdaTest App Automation - Real Cloud Devices" -ForegroundColor Green
Write-Host "APK: $ApkPath" -ForegroundColor Yellow
Write-Host "Plan: Lifetime Free 100 Minutes/Month" -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $ApkPath)) {
    Write-Error "APK file not found at $ApkPath"
    exit 1
}

if (-not $Username -or -not $AccessKey) {
    Write-Host "`nLambdaTest Credentials:" -ForegroundColor Yellow
    Write-Host "To execute on LambdaTest with free account:" -ForegroundColor Cyan
    Write-Host "1. Sign up at https://accounts.lambdatest.com/register (Lifetime 100 Mins Free)" -ForegroundColor White
    Write-Host "2. Get Username & AccessKey from Profile -> Password & Security" -ForegroundColor White
    Write-Host "3. Run: .\platforms\lambdatest\run-lambdatest.ps1 -Username 'YOUR_USER' -AccessKey 'YOUR_KEY'" -ForegroundColor Green
    Write-Host "`nOr upload manually via browser:" -ForegroundColor Cyan
    Write-Host "https://appautomation.lambdatest.com/app" -ForegroundColor White
    exit 0
}

Write-Host "`n[Step 1/2] Uploading APK to LambdaTest Cloud Storage..." -ForegroundColor Cyan
$uploadUrl = "https://manual-api.lambdatest.com/app/upload/realDevice"
$response = & curl.exe -s -u "${Username}:${AccessKey}" -X POST $uploadUrl -F "appFile=@$ApkPath" -F "name=TodoMasterReleaseApp"
$json = $response | ConvertFrom-Json

if ($json.app_id) {
    Write-Host "✓ Uploaded successfully! App URL: $($json.app_url)" -ForegroundColor Green
} else {
    Write-Host "Response: $response" -ForegroundColor Yellow
}

