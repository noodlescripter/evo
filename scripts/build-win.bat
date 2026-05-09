@echo off
REM Evo Windows Build Script (Command Prompt)
setlocal enabledelayedexpansion

set REPO_URL=https://github.com/nullruntime-dev/evo.git
set BUILD_DIR=%TEMP%\evo-build
set OUTPUT_DIR=%USERPROFILE%\Downloads

echo === Evo Windows Build Script ===

REM Check dependencies
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js required. Download from https://nodejs.org
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo Python required. Download from https://python.org
    exit /b 1
)

REM Clean previous build
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"

echo Cloning repository...
git clone --depth 1 %REPO_URL% "%BUILD_DIR%"
cd /d "%BUILD_DIR%"

echo Installing dependencies...
call npm install

echo Installing Python deps...
pip install mss

echo Building for Windows...
call npm run build:win

echo Copying to Downloads...
copy /y "release\*.exe" "%OUTPUT_DIR%\"

echo.
echo === Build complete ===
dir "%OUTPUT_DIR%\Evo*.exe"

REM Cleanup
cd /d "%USERPROFILE%"
rmdir /s /q "%BUILD_DIR%"
