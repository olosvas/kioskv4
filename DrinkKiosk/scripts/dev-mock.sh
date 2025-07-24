#!/bin/bash

# Development script with mock hardware
# Safe for development without GPIO hardware

echo "🎭 Starting development with mock hardware..."

# Force mock hardware
export USE_MOCK_GPIO=true
export NODE_ENV=development

echo "🔧 Hardware: Mock simulation"
echo "🌍 Environment: Development" 
echo "🚀 Starting application..."

npm run dev