# Evo Windows Build Script (PowerShell)
$ErrorActionPreference = "Stop"

$REPO_URL = "https://github.com/nullruntime-dev/evo.git"
$BUILD_DIR = "$env:TEMP\evo-build"
$OUTPUT_DIR = "$env:USERPROFILE\Downloads"

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║      " -ForegroundColor Cyan -NoNewline
Write-Host "Evo Windows Build Script" -ForegroundColor White -NoNewline
Write-Host "         ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check dependencies
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "Node.js required. Download from https://nodejs.org" -ForegroundColor Yellow
    exit 1
}
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python required. Download from https://python.org" -ForegroundColor Yellow
    exit 1
}

# Clean previous build
if (Test-Path $BUILD_DIR) { Remove-Item -Recurse -Force $BUILD_DIR }
New-Item -ItemType Directory -Path $BUILD_DIR | Out-Null

Write-Host "[1/5] " -ForegroundColor White -NoNewline
Write-Host "Cloning repository..."
git clone --depth 1 $REPO_URL $BUILD_DIR
Set-Location $BUILD_DIR

Write-Host "[2/5] " -ForegroundColor White -NoNewline
Write-Host "Installing dependencies..."
npm install

Write-Host "[3/5] " -ForegroundColor White -NoNewline
Write-Host "Installing Python deps..."
pip install mss

Write-Host "[4/5] " -ForegroundColor White -NoNewline
Write-Host "Building for Windows..."
npm run build:win

Write-Host "[5/5] " -ForegroundColor White -NoNewline
Write-Host "Copying to Downloads..."
Copy-Item "release\*.exe" $OUTPUT_DIR -Force

# Cleanup
Set-Location $env:USERPROFILE
Remove-Item -Recurse -Force $BUILD_DIR

# Get installer files
$SetupFile = Get-ChildItem "$OUTPUT_DIR\Evo*Setup*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
$PortableFile = Get-ChildItem "$OUTPUT_DIR\Evo*Portable*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           " -ForegroundColor Green -NoNewline
Write-Host "BUILD SUCCESSFUL!" -ForegroundColor White -NoNewline
Write-Host "            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Installer Location:" -ForegroundColor Yellow
Write-Host ""

if ($SetupFile) {
    Write-Host "    Setup:    " -ForegroundColor Cyan -NoNewline
    Write-Host "$($SetupFile.FullName)" -ForegroundColor White
}
if ($PortableFile) {
    Write-Host "    Portable: " -ForegroundColor Cyan -NoNewline
    Write-Host "$($PortableFile.FullName)" -ForegroundColor White
}

Write-Host ""
Write-Host "  To install:" -ForegroundColor Cyan
Write-Host "    Double-click the Setup .exe file"
Write-Host "    Or run the Portable .exe directly"
Write-Host ""
