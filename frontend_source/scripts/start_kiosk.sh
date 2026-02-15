#!/bin/bash

# Export display to ensure Chromium knows where to render
export DISPLAY=:0

# Disable screen saver and power management to keep screen awake
xset s off
xset -dpms
xset s noblank

# Kill any existing Chromium instances to start fresh
killall chromium 2>/dev/null
killall -9 chromium 2>/dev/null

# Clean up lock files (just in case of crash)
rm -rf ~/.config/chromium/Singleton*

# Start Chromium in Kiosk mode
# - No first run checks
# - Kiosk mode (fullscreen, no bars)
# - No Incognito (so it saves login session)
# - Set window size to match native 1080p resolution
chromium \
  --no-first-run \
  --no-default-browser-check \
  --kiosk \
  --window-position=0,0 \
  --window-size=1920,1080 \
  http://127.0.0.1:4028
