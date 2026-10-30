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
$SUITE_FOLDER = ".\browserstack\maestro_suite"
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

# 1. Package Maestro YAML into Parent Folder ZIP
Write-Host "`n[Step 1/4] Packaging Maestro test flow into BrowserStack-compliant ZIP..." -ForegroundColor Cyan
if (Test-Path $SUITE_FOLDER) { Remove-Item -Recurse -Force $SUITE_FOLDER }
if (Test-Path $TEST_ZIP_PATH) { Remove-Item -Force $TEST_ZIP_PATH }

New-Item -ItemType Directory -Path $SUITE_FOLDER -Force | Out-Null
Copy-Item -Path $TEST_FLOW_PATH -Destination "$SUITE_FOLDER\google-tasks-crud-e2e.yaml" -Force

Compress-Archive -Path $SUITE_FOLDER -DestinationPath $TEST_ZIP_PATH -Force
Write-Host "✓ Created BrowserStack-compliant suite: $TEST_ZIP_PATH" -ForegroundColor Green

# 2. Upload APK to BrowserStack App Automate
Write-Host "`n[Step 2/4] Uploading Release APK (62.2 MB) to BrowserStack App Automate..." -ForegroundColor Cyan
try {
    $apkResponse = & curl.exe -s -u "${Username}:${AccessKey}" -X POST "https://api-cloud.browserstack.com/app-automate/upload" -F "file=@$APK_PATH" -F "custom_id=TodoMasterReleaseApp"
    $apkUpload = $apkResponse | ConvertFrom-Json
    if (-not $apkUpload.app_url) {
        Write-Error "Upload failed or returned unexpected response: $apkResponse"
        exit 1
    }
    $appUrl = $apkUpload.app_url
    Write-Host "✓ APK Uploaded successfully! App URL: $appUrl" -ForegroundColor Green
} catch {
    Write-Error "Failed to upload APK to BrowserStack: $_"
    exit 1
}

# 3. Upload Maestro Test Suite ZIP
Write-Host "`n[Step 3/4] Uploading Maestro test suite ZIP..." -ForegroundColor Cyan
try {
    $suiteResponse = & curl.exe -s -u "${Username}:${AccessKey}" -X POST "https://api-cloud.browserstack.com/app-automate/maestro/v2/test-suite" -F "file=@$TEST_ZIP_PATH" -F "custom_id=TodoMasterMaestroSuite"
    $suiteUpload = $suiteResponse | ConvertFrom-Json
    if (-not $suiteUpload.test_suite_url) {
        Write-Error "Test suite upload failed or returned unexpected response: $suiteResponse"
        exit 1
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
    execute = @("google-tasks-crud-e2e.yaml")
    project = "TodoMaster Mobile E2E"
    build = "Build-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    name = "Google Tasks Complete CRUD Flow"
    deviceLogs = $true
    networkLogs = $true
} | ConvertTo-Json

try {
    $buildResponse = & curl.exe -s -u "${Username}:${AccessKey}" -X POST "https://api-cloud.browserstack.com/app-automate/maestro/v2/build" -H "Content-Type: application/json" -d $payload
    $buildExecution = $buildResponse | ConvertFrom-Json

    if (-not $buildExecution.build_id) {
        # Check if fallback endpoint is needed
        $buildResponse = & curl.exe -s -u "${Username}:${AccessKey}" -X POST "https://api-cloud.browserstack.com/app-automate/maestro/v2/android/build" -H "Content-Type: application/json" -d $payload
        $buildExecution = $buildResponse | ConvertFrom-Json
    }

    if (-not $buildExecution.build_id) {
        Write-Host "Response from server: $buildResponse" -ForegroundColor Red
        Write-Error "Failed to get build_id from BrowserStack."
        exit 1
    }

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

