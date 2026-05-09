# Evo Windows Build Script
$ErrorActionPreference = "Stop"

$REPO_URL = "https://github.com/nullruntime-dev/electron-overlay.git"
$BUILD_DIR = "$env:TEMP\evo-build"
$OUTPUT_DIR = "$env:USERPROFILE\Downloads"

Write-Host "=== Evo Windows Build Script ===" -ForegroundColor Cyan

# Check dependencies
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js required. Download from https://nodejs.org" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python required. Download from https://python.org" -ForegroundColor Red
    exit 1
}

# Clean previous build
if (Test-Path $BUILD_DIR) { Remove-Item -Recurse -Force $BUILD_DIR }
New-Item -ItemType Directory -Path $BUILD_DIR | Out-Null

Write-Host "Cloning repository..."
git clone --depth 1 $REPO_URL $BUILD_DIR
Set-Location $BUILD_DIR

Write-Host "Installing dependencies..."
npm install

Write-Host "Installing Python deps..."
pip install mss

Write-Host "Building for Windows..."
npm run build:win

Write-Host "Copying to Downloads..."
Copy-Item "release\*.exe" $OUTPUT_DIR -Force

Write-Host ""
Write-Host "=== Build complete ===" -ForegroundColor Green
Get-ChildItem "$OUTPUT_DIR\Evo*.exe"

# Cleanup
Set-Location $env:USERPROFILE
Remove-Item -Recurse -Force $BUILD_DIR
