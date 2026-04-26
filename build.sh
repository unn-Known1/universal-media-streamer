#!/bin/bash

# Universal Media Streamer - Build Script
# ======================================

set -e  # Exit on error

echo "🔨 Building Universal Media Streamer..."

# Define the build directory - absolute path to prevent accidental deletion
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${SCRIPT_DIR}/dist"

# Safety check: Verify we're in the expected directory
if [ ! -f "${SCRIPT_DIR}/package.json" ]; then
    echo "❌ Error: package.json not found. Are you running this from the project root?"
    exit 1
fi

# Clean previous build with safety checks
echo "📦 Cleaning previous build..."
if [ -d "${BUILD_DIR}" ]; then
    # Verify BUILD_DIR is within SCRIPT_DIR to prevent accidental deletion
    case "${BUILD_DIR}" in
        "${SCRIPT_DIR}"*)
            rm -rf "${BUILD_DIR}"
            ;;
        *)
            echo "❌ Error: Build directory path is outside project directory. Aborting for safety."
            exit 1
            ;;
    esac
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Build the project
echo "🔨 Building production bundle..."
npm run build

# Verify build output
if [ -d "${BUILD_DIR}" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Output directory: ${BUILD_DIR}"
    echo "🌐 To preview locally: npm run preview"
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi
