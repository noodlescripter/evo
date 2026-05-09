@echo off
REM Evo Windows Build Script (Command Prompt)
setlocal enabledelayedexpansion

set REPO_URL=https://github.com/nullruntime-dev/evo.git
set BUILD_DIR=%TEMP%\evo-build
set OUTPUT_DIR=%USERPROFILE%\Downloads

echo.
echo [96m╔════════════════════════════════════════╗[0m
echo [96m║      [97mEvo Windows Build Script[96m         ║[0m
echo [96m╚════════════════════════════════════════╝[0m
echo.

REM Check dependencies
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [93mNode.js required. Download from https://nodejs.org[0m
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [93mPython required. Download from https://python.org[0m
    exit /b 1
)

REM Clean previous build
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"

echo [97m[1/5][0m Cloning repository...
git clone --depth 1 %REPO_URL% "%BUILD_DIR%"
cd /d "%BUILD_DIR%"

echo [97m[2/5][0m Installing dependencies...
call npm install

echo [97m[3/5][0m Installing Python deps...
pip install mss

echo [97m[4/5][0m Building for Windows...
call npm run build:win

echo [97m[5/5][0m Copying to Downloads...
copy /y "release\*.exe" "%OUTPUT_DIR%\" >nul

REM Cleanup
cd /d "%USERPROFILE%"
rmdir /s /q "%BUILD_DIR%"

REM Find installer files
for %%f in ("%OUTPUT_DIR%\Evo*Setup*.exe") do set SETUP_FILE=%%f
for %%f in ("%OUTPUT_DIR%\Evo*Portable*.exe") do set PORTABLE_FILE=%%f

echo.
echo [92m╔════════════════════════════════════════╗[0m
echo [92m║           [97mBUILD SUCCESSFUL![92m            ║[0m
echo [92m╚════════════════════════════════════════╝[0m
echo.
echo [93m  Installer Location:[0m
echo.

if defined SETUP_FILE (
    echo [96m    Setup:    [97m%SETUP_FILE%[0m
)
if defined PORTABLE_FILE (
    echo [96m    Portable: [97m%PORTABLE_FILE%[0m
)

echo.
echo [96m  To install:[0m
echo     Double-click the Setup .exe file
echo     Or run the Portable .exe directly
echo.
