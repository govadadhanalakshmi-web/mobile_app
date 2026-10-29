# ==============================================================
# Helper Script: Download & Configure Portable Android ADB
# Downloads Google's official lightweight Platform Tools (12MB)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/setup-adb.ps1
# ==============================================================

$targetDir = Join-Path $PSScriptRoot "..\tools\platform-tools"
$zipPath = Join-Path $PSScriptRoot "..\tools\platform-tools.zip"
$toolsDir = Join-Path $PSScriptRoot "..\tools"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Portable Android ADB Tools" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (Test-Path (Join-Path $targetDir "adb.exe")) {
    Write-Host "[OK] ADB is already installed at: $targetDir\adb.exe" -ForegroundColor Green
    & (Join-Path $targetDir "adb.exe") version
    exit 0
}

if (-not (Test-Path $toolsDir)) {
    New-Item -ItemType Directory -Path $toolsDir -Force | Out-Null
}

$downloadUrl = "https://dl.google.com/android/repository/platform-tools-latest-windows.zip"
Write-Host "[1/3] Downloading Google official platform-tools..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath

Write-Host "[2/3] Extracting zip archive..." -ForegroundColor Yellow
Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
Remove-Item $zipPath -Force

Write-Host "[3/3] Verifying ADB executable..." -ForegroundColor Yellow
if (Test-Path (Join-Path $targetDir "adb.exe")) {
    Write-Host "[SUCCESS] Portable ADB ready at: $targetDir\adb.exe" -ForegroundColor Green
    & (Join-Path $targetDir "adb.exe") version
    Write-Host "`nTo connect phone via USB Debugging, run:" -ForegroundColor Cyan
    Write-Host "  tools\platform-tools\adb.exe devices" -ForegroundColor White
    Write-Host "  tools\platform-tools\adb.exe reverse tcp:8000 tcp:8000" -ForegroundColor White
} else {
    Write-Host "[ERROR] Could not find adb.exe after extraction." -ForegroundColor Red
}

