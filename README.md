# Evo - AI Screen Assistant

Transparent overlay for AI-powered screen analysis. Supports Anthropic Claude and Ollama (local/cloud).

## Application Scan
[![Sonar Scan](https://github.com/nullruntime-dev/evo/actions/workflows/security-scan.yml/badge.svg)](https://github.com/nullruntime-dev/evo/actions/workflows/security-scan.yml)

## Download

Pre-built binaries available on [GitHub Releases](https://github.com/nullruntime-dev/evo/releases):

| Platform | Format |
|----------|--------|
| Linux | AppImage, .deb |
| Windows | Installer (.exe), Portable (.exe) |
| macOS | Build manually (see below) |

## Features

- Frameless transparent overlay (always on top)
- Screenshot capture via XDG Desktop Portal (Wayland) or fallback methods
- Streaming AI responses with markdown rendering
- Multiple providers: Anthropic, Ollama Local, Ollama Cloud
- Custom skills/system prompts
- Window opacity control
- Token usage tracking

## Requirements

- Node.js 18+
- Python 3 with `dbus_fast` (for Wayland screenshots)
- Linux (tested on Arch, should work on Debian/Ubuntu)

### Python Dependencies

```bash
pip install dbus_fast
# or
pip install mss  # fallback for X11
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev
```

## Building

### Build All Linux Targets

```bash
npm run build:linux
```

Creates both AppImage and deb in `release/` folder.

### Build Specific Target

```bash
# AppImage only
npm run build:appimage

# Debian package only
npm run build:deb
```

## Quick Build Scripts

For manual builds (or macOS where pre-built binaries aren't available):

**macOS (required - no pre-built binaries):**
```bash
curl -fsSL https://raw.githubusercontent.com/nullruntime-dev/evo/develop/scripts/build-mac.sh | bash
```

**Linux (optional - pre-built available):**
```bash
curl -fsSL https://raw.githubusercontent.com/nullruntime-dev/evo/develop/scripts/build-linux.sh | bash
```

**Windows (optional - pre-built available):**
```powershell
# PowerShell
Invoke-WebRequest -useb https://raw.githubusercontent.com/nullruntime-dev/evo/develop/scripts/build-win.ps1 | Invoke-Expression

# Or Command Prompt
curl -fsSL https://raw.githubusercontent.com/nullruntime-dev/evo/develop/scripts/build-win.bat -o build-win.bat && build-win.bat
```

## CI/CD & Code Quality

All code merged to `develop` must pass:

| Check | Tool | What it does |
|-------|------|--------------|
| Security Scan | SonarQube | Code vulnerabilities, bugs, code smells |
| Quality Gate | SonarQube | Coverage, duplication, maintainability |

PRs are blocked until all checks pass. View results in the [SonarCloud Dashboard](https://sonarcloud.io/project/overview?id=noodlescripter_evo&branch=develop).

### Releases

Push a version tag to trigger builds:
```bash
git tag v1.0.0
git push origin v1.0.0
```

Builds Linux + Windows automatically, publishes to GitHub Releases.

### Branch Strategy

- `develop` - Main development branch (protected)
- Feature branches → PR to `develop` → Must pass all scans
- Version tags (`v*`) → Trigger release builds

## Installation

### AppImage (Any Linux)

```bash
chmod +x release/Evo-1.0.0.AppImage
./release/Evo-1.0.0.AppImage
```

Or move to a location in PATH:

```bash
chmod +x release/Evo-1.0.0.AppImage
sudo mv release/Evo-1.0.0.AppImage /usr/local/bin/evo
evo  # launch from anywhere
```

### Debian Package (Debian/Ubuntu)

```bash
sudo dpkg -i release/evo_1.0.0_amd64.deb
evo  # launch from terminal
```

### Arch Linux (Manual)

```bash
# Use the AppImage method above, or extract and run:
./release/linux-unpacked/evo
```

## Usage

1. Launch Evo
2. Click gear icon to open Settings
3. Select provider (Anthropic/Ollama Local/Ollama Cloud)
4. Enter API key (for Anthropic/Ollama Cloud)
5. Select model
6. Adjust opacity if needed
7. Click camera icon to capture screenshot and analyze
8. Or type in the input field and click send for text-only chat

### Keyboard

- Drag title bar to move window
- Drag bottom-right corner to resize

## Configuration

Settings stored in:
- `~/.config/evo/evo-config.json` - Window opacity
- Browser localStorage - API keys, model selection, skills

## Project Structure

```
electron-overlay/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # IPC bridge
├── src/
│   ├── App.jsx          # Main React component
│   └── components/
│       ├── TitleBar.jsx
│       ├── Chat.jsx
│       ├── Message.jsx
│       ├── Settings.jsx
│       └── Footer.jsx
├── python/
│   └── screenshot.py    # Screenshot capture
└── package.json
```

## Troubleshooting

### Screenshot not working on Wayland

Install dbus_fast:
```bash
pip install dbus_fast
```

Make sure XDG Desktop Portal is running:
```bash
systemctl --user status xdg-desktop-portal
```

### Transparency not working

The app uses CSS opacity for Linux compatibility. If window appears solid, try:
```bash
# Restart with GPU disabled (already default)
./Evo-1.0.0.AppImage --disable-gpu
```

### GPU/VSync warnings in console

These are harmless. Suppressed with `--log-level=3` flag.

## License

MIT
