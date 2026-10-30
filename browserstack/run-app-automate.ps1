# ==============================================================================
# BrowserStack App Automate - Automated Maestro Test Execution Script
# Usage:
#   .\browserstack\run-app-automate.ps1 -Username "YOUR_USER" -AccessKey "YOUR_KEY"
# ==============================================================================

param (
    [Parameter(Mandatory=$true, HelpMessage="Enter your BrowserStack Username")]
    [string]$Username,

    [Parameter(Mandatory=$true, HelpMessage="Enter your BrowserStack Access Key")]
    [string]$AccessKey,

    [Parameter(Mandatory=$false)]
    [string[]]$Devices = @("Samsung Galaxy S23-13.0", "Google Pixel 8-14.0")
)

$ErrorActionPreference = "Stop"

$APK_PATH = ".\firebase\TodoMaster-Release.apk"
$TEST_FLOW_PATH = ".\frontend\tests\e2e\google-tasks-crud-e2e.yaml"
$TEST_ZIP_PATH = ".\browserstack\maestro-suite.zip"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "BrowserStack App Automate - Maestro Cloud Execution" -ForegroundColor Green
Write-Host "App APK: $APK_PATH" -ForegroundColor Yellow
Write-Host "Test Flow: $TEST_FLOW_PATH" -ForegroundColor Yellow
Write-Host "Target Devices: $($Devices -join ', ')" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $APK_PATH)) {
    Write-Error "APK file not found at $APK_PATH"
    exit 1
}

if (-not (Test-Path $TEST_FLOW_PATH)) {
    Write-Error "Maestro flow not found at $TEST_FLOW_PATH"
    exit 1
}

# 1. Package Maestro YAML into ZIP
Write-Host "`n[Step 1/3] Packaging Maestro test flow into ZIP..." -ForegroundColor Cyan
Compress-Archive -Path $TEST_FLOW_PATH -DestinationPath $TEST_ZIP_PATH -Force
Write-Host "✓ Created: $TEST_ZIP_PATH" -ForegroundColor Green

# 2. Upload APK to BrowserStack App Automate
Write-Host "`n[Step 2/3] Uploading Release APK to BrowserStack App Automate..." -ForegroundColor Cyan
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${Username}:${AccessKey}"))

try {
    $apkUpload = Invoke-RestMethod -Uri "https://api-cloud.browserstack.com/app-automate/upload" `
        -Method Post `
        -Headers @{ Authorization = "Basic $auth" } `
        -Form @{ 
            file = Get-Item -Path $APK_PATH
            custom_id = "TodoMasterReleaseApp"
        }
    $appUrl = $apkUpload.app_url
    Write-Host "✓ APK Uploaded successfully! App URL: $appUrl" -ForegroundColor Green
} catch {
    Write-Error "Failed to upload APK to BrowserStack: $_"
    exit 1
}

# 3. Upload Maestro Test Suite ZIP
Write-Host "`n[Step 3/3] Uploading Maestro test suite..." -ForegroundColor Cyan
try {
    $suiteUpload = Invoke-RestMethod -Uri "https://api-cloud.browserstack.com/app-automate/maestro/v2/test-suite" `
        -Method Post `
        -Headers @{ Authorization = "Basic $auth" } `
        -Form @{ 
            file = Get-Item -Path $TEST_ZIP_PATH
            custom_id = "TodoMasterMaestroSuite"
        }
    $suiteUrl = $suiteUpload.test_suite_url
    Write-Host "✓ Test Suite Uploaded! Suite URL: $suiteUrl" -ForegroundColor Green
} catch {
    Write-Error "Failed to upload Maestro test suite: $_"
    exit 1
}

# 4. Trigger Maestro Cloud Execution
Write-Host "`n[Step 4/4] Triggering Maestro Automated Execution across Real Devices..." -ForegroundColor Cyan

$payload = @{
    app = $appUrl
    testSuite = $suiteUrl
    devices = $Devices
    project = "TodoMaster Mobile E2E"
    build = "Build-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    name = "Google Tasks Complete CRUD Flow"
    deviceLogs = $true
    networkLogs = $true
} | ConvertTo-Json

try {
    $buildExecution = Invoke-RestMethod -Uri "https://api-cloud.browserstack.com/app-automate/maestro/v2/build" `
        -Method Post `
        -Headers @{ 
            Authorization = "Basic $auth"
            "Content-Type" = "application/json"
        } `
        -Body $payload

    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host "🎉 TEST EXECUTION TRIGGERED SUCCESSFULLY IN THE CLOUD!" -ForegroundColor Green
    Write-Host "Build ID: $($buildExecution.build_id)" -ForegroundColor Yellow
    Write-Host "Message: $($buildExecution.message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Live Dashboard & Video Link:" -ForegroundColor Cyan
    Write-Host "https://app-automate.browserstack.com/dashboard/v2/builds/$($buildExecution.build_id)" -ForegroundColor White -BackgroundColor Blue
    Write-Host "==========================================================" -ForegroundColor Green
} catch {
    Write-Error "Failed to trigger Maestro execution: $_"
    exit 1
}
