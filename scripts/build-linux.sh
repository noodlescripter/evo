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
echo -e "${CYAN}║      ${WHITE}Evo Linux Build Script${CYAN}           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check dependencies
command -v node >/dev/null 2>&1 || { echo -e "${YELLOW}Node.js required. Install via package manager${NC}"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo -e "${YELLOW}Python3 required${NC}"; exit 1; }

# Clean previous build
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
mkdir -p "$OUTPUT_DIR"

echo -e "${WHITE}[1/5]${NC} Cloning repository..."
git clone --depth 1 "$REPO_URL" "$BUILD_DIR"
cd "$BUILD_DIR"

echo -e "${WHITE}[2/5]${NC} Installing dependencies..."
npm install

echo -e "${WHITE}[3/5]${NC} Installing Python deps..."
pip3 install mss --user

echo -e "${WHITE}[4/5]${NC} Building for Linux..."
npm run build:appimage

echo -e "${WHITE}[5/5]${NC} Copying to Downloads..."
cp release/*.AppImage "$OUTPUT_DIR/"

# Cleanup
rm -rf "$BUILD_DIR"

# Get the actual filename
INSTALLER=$(ls "$OUTPUT_DIR"/Evo*.AppImage 2>/dev/null | head -1)

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ${WHITE}BUILD SUCCESSFUL!${GREEN}            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}  Installer Location:${NC}"
echo ""
echo -e "    ${WHITE}$INSTALLER${NC}"
echo ""
echo -e "${CYAN}  To run:${NC}"
echo -e "    chmod +x \"$INSTALLER\""
echo -e "    \"$INSTALLER\""
echo ""
