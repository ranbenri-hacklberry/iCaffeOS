#!/bin/bash

# AntiGravity Claude Proxy Setup Script

PLIST_SOURCE="./tools/com.user.antigravity-proxy.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.user.antigravity-proxy.plist"

echo "🚀 Setting up AntiGravity Claude Proxy..."

# 1. Install Service
if [ -f "$PLIST_SOURCE" ]; then
    echo "📦 Installing LaunchAgent..."
    cp "$PLIST_SOURCE" "$PLIST_DEST"
    
    # Unload if exists (to force reload)
    launchctl unload "$PLIST_DEST" 2>/dev/null
    
    # Load service
    launchctl load "$PLIST_DEST"
    echo "✅ Service installed and started!"
else
    echo "❌ Error: Plist file not found at $PLIST_SOURCE"
fi

# 2. Setup Environment Variables
echo "🔧 Configuring Shell Environment..."
SHELL_RC="$HOME/.zshrc"

if ! grep -q "ANTHROPIC_BASE_URL" "$SHELL_RC"; then
    echo "" >> "$SHELL_RC"
    echo "# AntiGravity Claude Proxy" >> "$SHELL_RC"
    echo "export ANTHROPIC_BASE_URL='http://localhost:8080'" >> "$SHELL_RC"
    echo "export CLAUDE_BASE_URL='http://localhost:8080'" >> "$SHELL_RC"
    echo "✅ Added environment variables to $SHELL_RC"
    echo "👉 Please run 'source ~/.zshrc' to apply changes."
else
    echo "ℹ️ Environment variables already present in $SHELL_RC"
fi

echo "🎉 Setup Complete!"
echo "Next steps:"
echo "1. Authenticate your accounts: antigravity-claude-proxy accounts add"
echo "2. Check logs if needed: tail -f /tmp/antigravity-proxy.log"
