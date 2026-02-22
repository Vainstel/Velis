#!/bin/bash

# Script to add auto-open functionality to Tauri-generated DMG
# This makes the DMG automatically open a Finder window when mounted

set -e

DMG_PATH="$1"

if [ -z "$DMG_PATH" ]; then
    echo "Usage: $0 <path-to-dmg>"
    exit 1
fi

if [ ! -f "$DMG_PATH" ]; then
    echo "Error: DMG file not found: $DMG_PATH"
    exit 1
fi

DMG_DIR=$(dirname "$DMG_PATH")
DMG_NAME=$(basename "$DMG_PATH" .dmg)
TEMP_DMG="${DMG_DIR}/${DMG_NAME}_temp.dmg"

echo "Processing DMG: $DMG_PATH"

# 1. Convert DMG to read-write format
echo "Converting to read-write format..."
hdiutil convert "$DMG_PATH" -format UDRW -o "$TEMP_DMG"

# 2. Mount the temporary DMG
echo "Mounting DMG..."
MOUNT_POINT=$(hdiutil attach "$TEMP_DMG" | grep "/Volumes" | sed 's/.*\/Volumes/\/Volumes/')

if [ -z "$MOUNT_POINT" ]; then
    echo "Error: Failed to mount DMG"
    rm "$TEMP_DMG"
    exit 1
fi

echo "Mounted at: $MOUNT_POINT"

# 3. Set auto-open flag using bless
echo "Setting auto-open flag..."
bless --folder "$MOUNT_POINT" --openfolder "$MOUNT_POINT"

# 4. Unmount
echo "Unmounting..."
hdiutil detach "$MOUNT_POINT"

# 5. Convert back to compressed read-only format
echo "Converting back to compressed format..."
rm "$DMG_PATH"
hdiutil convert "$TEMP_DMG" -format UDZO -o "$DMG_PATH"

# 6. Clean up
echo "Cleaning up..."
rm "$TEMP_DMG"

echo "✅ DMG updated successfully: $DMG_PATH"
echo "The DMG will now automatically open a Finder window when mounted."