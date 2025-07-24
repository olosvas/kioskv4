#!/bin/bash

# Production script for Raspberry Pi with real GPIO
# This is the main production deployment script

echo "🚀 Starting production with real GPIO hardware..."

# Production configuration
export NODE_ENV=production
export USE_REAL_GPIO=true
export PORT=3000

# Check if pigpio daemon is running
if ! pgrep -x "pigpiod" > /dev/null; then
    echo "🚀 Starting pigpio daemon..."
    sudo systemctl start pigpiod
    sleep 2
fi

# Verify pigpio is running
if ! pgrep -x "pigpiod" > /dev/null; then
    echo "❌ Failed to start pigpio daemon"
    echo "💡 Try: sudo systemctl enable pigpiod && sudo systemctl start pigpiod"
    exit 1
fi

echo "🔧 Hardware: Real GPIO enabled"
echo "🌍 Environment: Production"
echo "🚀 Starting application with sudo permissions..."

# Build application first
npm run build

# Run production with GPIO permissions
sudo -E npm start