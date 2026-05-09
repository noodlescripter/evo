#!/bin/bash
set -e

REPO_URL="https://github.com/nullruntime-dev/evo.git"
BUILD_DIR="/tmp/evo-build"
OUTPUT_DIR="$HOME/Downloads"

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║      ${WHITE}Evo macOS Build Script${CYAN}           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check dependencies
command -v node >/dev/null 2>&1 || { echo -e "${YELLOW}Node.js required. Install: brew install node${NC}"; exit 1; }

# Clean previous build
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
mkdir -p "$OUTPUT_DIR"

echo -e "${WHITE}[1/4]${NC} Cloning repository..."
git clone --depth 1 "$REPO_URL" "$BUILD_DIR"
cd "$BUILD_DIR"

echo -e "${WHITE}[2/4]${NC} Installing dependencies..."
npm install

echo -e "${WHITE}[3/4]${NC} Building for macOS..."
npm run build:dmg

echo -e "${WHITE}[4/4]${NC} Copying to Downloads..."
cp release/*.dmg "$OUTPUT_DIR/"

# Cleanup
rm -rf "$BUILD_DIR"

# Get the actual filename
INSTALLER=$(ls "$OUTPUT_DIR"/Evo*.dmg 2>/dev/null | head -1)

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ${WHITE}BUILD SUCCESSFUL!${GREEN}            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}  Installer Location:${NC}"
echo ""
echo -e "    ${WHITE}$INSTALLER${NC}"
echo ""
echo -e "${CYAN}  To install:${NC}"
echo -e "    Double-click the .dmg file"
echo -e "    Drag Evo to Applications folder"
echo ""
