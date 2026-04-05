#!/bin/bash

# Universal Media Streamer - Build Script
# ======================================

set -e  # Exit on error

echo "🔨 Building Universal Media Streamer..."

# Clean previous build
echo "📦 Cleaning previous build..."
rm -rf dist

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building production bundle..."
npm run build

# Verify build output
if [ -d "dist" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Output directory: dist/"
    echo "🌐 To preview locally: npm run preview"
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi
