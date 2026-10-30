# ==============================================================================
# AWS Device Farm - Automated Real Physical Device Test Execution
# Free Tier: 1,000 Device Minutes (One-Time Trial across Real Phones)
# ==============================================================================

param (
    [Parameter(Mandatory=$false)]
    [string]$ProjectArn,

    [Parameter(Mandatory=$false)]
    [string]$DevicePoolArn,

    [Parameter(Mandatory=$false)]
    [string]$ApkPath = ".\firebase\TodoMaster-Release.apk"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "AWS Device Farm - Real Device Cloud Execution" -ForegroundColor Green
Write-Host "APK: $ApkPath" -ForegroundColor Yellow
Write-Host "Trial: 1,000 Device Minutes Available (~16.6 Hours)" -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $ApkPath)) {
    Write-Error "APK file not found at $ApkPath"
    exit 1
}

Write-Host "`n[Step 1] Verifying AWS CLI and Credentials..." -ForegroundColor Cyan
try {
    $awsIdentity = & aws sts get-caller-identity 2>&1
    Write-Host "AWS Connected: $awsIdentity" -ForegroundColor Green
} catch {
    Write-Host "AWS CLI credentials not configured locally." -ForegroundColor Yellow
    Write-Host "To run in AWS Device Farm console:" -ForegroundColor Cyan
    Write-Host "1. Open https://console.aws.amazon.com/devicefarm" -ForegroundColor White
    Write-Host "2. Create a Project 'TodoMaster-Mobile'" -ForegroundColor White
    Write-Host "3. Upload '$ApkPath' as Android Native Application" -ForegroundColor White
    Write-Host "4. Select Built-in: Fuzz / Explorer or Maestro / Custom Environment" -ForegroundColor White
    Write-Host "5. Choose Top Android Devices (Samsung Galaxy, Google Pixel)" -ForegroundColor White
    Write-Host "6. Click 'Confirm and Start Run' (uses 1,000 free minutes)" -ForegroundColor Green
    exit 0
}

