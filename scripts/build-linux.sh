#!/bin/bash
set -e

REPO_URL="https://github.com/nullruntime-dev/evo.git"
BUILD_DIR="/tmp/evo-build"
OUTPUT_DIR="$HOME/Downloads"

echo "=== Evo Linux Build Script ==="

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "Node.js required. Install via package manager"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python3 required"; exit 1; }

# Clean previous build
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
mkdir -p "$OUTPUT_DIR"

echo "Cloning repository..."
git clone --depth 1 "$REPO_URL" "$BUILD_DIR"
cd "$BUILD_DIR"

echo "Installing dependencies..."
npm install

echo "Installing Python deps..."
pip3 install mss --user

echo "Building for Linux..."
npm run build:appimage

echo "Copying to Downloads..."
cp release/*.AppImage "$OUTPUT_DIR/"

echo ""
echo "=== Build complete ==="
ls -la "$OUTPUT_DIR"/*.AppImage

# Cleanup
rm -rf "$BUILD_DIR"
