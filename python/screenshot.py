#!/usr/bin/env python3
"""
Screenshot capture functionality.
Prints path to stdout on success.
"""

import os
import sys
import shutil
import subprocess
import asyncio
import tempfile
import platform
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote, urlparse


def _is_windows() -> bool:
    """Check if running on Windows."""
    return platform.system() == "Windows"


def _is_wayland() -> bool:
    """Check if running on Wayland."""
    return os.environ.get("XDG_SESSION_TYPE") == "wayland" or "WAYLAND_DISPLAY" in os.environ


def _is_gnome() -> bool:
    """Check if running GNOME."""
    return "GNOME" in os.environ.get("XDG_CURRENT_DESKTOP", "")


async def _portal_screenshot() -> str:
    """Take screenshot via XDG Desktop Portal. Returns file URI."""
    from dbus_fast.aio import MessageBus
    from dbus_fast import BusType, Variant

    bus = await MessageBus(bus_type=BusType.SESSION).connect()

    introspect = await bus.introspect(
        "org.freedesktop.portal.Desktop",
        "/org/freedesktop/portal/desktop"
    )
    proxy = bus.get_proxy_object(
        "org.freedesktop.portal.Desktop",
        "/org/freedesktop/portal/desktop",
        introspect
    )
    screenshot = proxy.get_interface("org.freedesktop.portal.Screenshot")

    loop = asyncio.get_event_loop()
    result_uri = loop.create_future()

    def on_response(response, results):
        if response == 0 and "uri" in results:
            result_uri.set_result(results["uri"].value)
        else:
            result_uri.set_exception(Exception(f"Screenshot failed: {response}"))

    # Request screenshot
    handle = await screenshot.call_screenshot("", {"interactive": Variant("b", True)})

    # Listen for response
    request_introspect = await bus.introspect(
        "org.freedesktop.portal.Desktop", handle
    )
    request_proxy = bus.get_proxy_object(
        "org.freedesktop.portal.Desktop", handle, request_introspect
    )
    request = request_proxy.get_interface("org.freedesktop.portal.Request")
    request.on_response(on_response)

    uri = await asyncio.wait_for(result_uri, timeout=30)
    bus.disconnect()
    return uri


def _portal_screenshot_sync() -> Path:
    """Synchronous wrapper for portal screenshot."""
    uri = asyncio.run(_portal_screenshot())
    # Convert file:// URI to path
    parsed = urlparse(uri)
    return Path(unquote(parsed.path))


def take_screenshot(monitor_num: int = 1) -> Path:
    """
    Capture screenshot of specified monitor.

    Args:
        monitor_num: Monitor index (1 = primary, 2 = secondary, 0 = all)

    Returns:
        Path to saved screenshot
    """
    screenshots_dir = Path(tempfile.gettempdir()) / "overlay_screenshots"
    screenshots_dir.mkdir(exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = screenshots_dir / f"shot_{timestamp}.png"

    if _is_windows():
        # Windows - use mss (cross-platform)
        import mss
        import mss.tools
        with mss.mss() as sct:
            monitor = sct.monitors[monitor_num]
            screenshot = sct.grab(monitor)
            mss.tools.to_png(screenshot.rgb, screenshot.size, output=str(filename))
    elif _is_wayland():
        if _is_gnome():
            # GNOME Wayland - use XDG portal
            portal_file = _portal_screenshot_sync()
            shutil.copy(portal_file, filename)
        else:
            # wlroots-based compositors - use grim
            subprocess.run(["grim", str(filename)], check=True)
    else:
        # X11 - use mss
        import mss
        import mss.tools
        with mss.mss() as sct:
            monitor = sct.monitors[monitor_num]
            screenshot = sct.grab(monitor)
            mss.tools.to_png(screenshot.rgb, screenshot.size, output=str(filename))

    return filename


if __name__ == "__main__":
    try:
        path = take_screenshot()
        print(path)
        sys.exit(0)
    except Exception as e:
        print(f"Screenshot failed: {e}", file=sys.stderr)
        sys.exit(1)
