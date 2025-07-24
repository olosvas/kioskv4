#!/bin/bash

# Development script to test with real GPIO
# This allows testing GPIO functionality during development

echo "🧪 Starting development with real GPIO testing..."

# Set environment to use real GPIO
export USE_REAL_GPIO=true
export NODE_ENV=development

# Check if pigpio is installed
if ! command -v pigpiod &> /dev/null; then
    echo "❌ pigpio not installed. Install with:"
    echo "   sudo apt install pigpio python3-pigpio"
    exit 1
fi

# Check if pigpio daemon is running
if ! pgrep -x "pigpiod" > /dev/null; then
    echo "🚀 Starting pigpio daemon..."
    sudo pigpiod
    sleep 2
fi

# Check if Node.js pigpio wrapper is installed
if ! npm list pigpio &> /dev/null; then
    echo "📦 Installing pigpio Node.js wrapper..."
    npm install pigpio
fi

echo "🔧 Hardware: Real GPIO enabled"
echo "🌍 Environment: Development"
echo "🚀 Starting application with sudo permissions..."

# Run with sudo for GPIO access
sudo -E npm run dev