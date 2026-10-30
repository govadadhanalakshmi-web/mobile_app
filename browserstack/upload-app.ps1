# ==============================================================================
# BrowserStack App Live - Direct REST API Upload Script
# Usage: .\browserstack\upload-app.ps1 -Username "YOUR_USER" -AccessKey "YOUR_KEY"
# ==============================================================================

param (
    [Parameter(Mandatory=$false)]
    [string]$Username = "",

    [Parameter(Mandatory=$false)]
    [string]$AccessKey = ""
)

$APK_PATH = ".\firebase\TodoMaster-Release.apk"

if (-not (Test-Path $APK_PATH)) {
    Write-Error "Release APK not found at $APK_PATH"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($Username) -or [string]::IsNullOrWhiteSpace($AccessKey)) {
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "BrowserStack App Live API Upload Instructions" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "మీ దగ్గర BrowserStack యూజర్‌నేమ్ & యాక్సెస్ కీ ఉంటే కింది విధంగా రన్ చేయండి:" -ForegroundColor White
    Write-Host ".\browserstack\upload-app.ps1 -Username 'YOUR_USER' -AccessKey 'YOUR_KEY'" -ForegroundColor Green
    Write-Host ""
    Write-Host "లేదా బ్రౌజర్‌లో నేరుగా అప్‌లోడ్ చేయడానికి:" -ForegroundColor White
    Write-Host "1. Open: https://app-live.browserstack.com" -ForegroundColor Cyan
    Write-Host "2. Drag and drop file: $APK_PATH" -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Cyan
    exit 0
}

Write-Host "Uploading $APK_PATH to BrowserStack App Live..." -ForegroundColor Cyan

$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${Username}:${AccessKey}"))

try {
    $response = Invoke-RestMethod -Uri "https://api-cloud.browserstack.com/app-live/upload" `
        -Method Post `
        -Headers @{ Authorization = "Basic $auth" } `
        -Form @{ file = Get-Item -Path $APK_PATH }

    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "Upload Successful!" -ForegroundColor Green
    Write-Host "App URL: $($response.app_url)" -ForegroundColor Yellow
    Write-Host "Custom ID: $($response.custom_id)" -ForegroundColor Yellow
    Write-Host "Open https://app-live.browserstack.com to launch your test session." -ForegroundColor Cyan
    Write-Host "==========================================================" -ForegroundColor Green
} catch {
    Write-Error "Upload failed: $_"
}

