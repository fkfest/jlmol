#!/bin/bash

# Create icons directory if it doesn't exist
mkdir -p build/icons

# Generate PNG icons in different sizes from SVG with transparency
for size in 16 32 48 64 128 256 512 1024; do
  magick "build/icon.svg" -background none -resize ${size}x${size} "build/icons/${size}x${size}.png"
done

# Generate Windows .ico file (using only standard Windows icon sizes)
magick "build/icons/16x16.png" "build/icons/32x32.png" "build/icons/48x48.png" "build/icons/256x256.png" -background none "build/icon.ico"

# Generate macOS .icns file
# Create temporary iconset directory
mkdir -p build/icon.iconset
cp build/icons/16x16.png build/icon.iconset/icon_16x16.png
cp build/icons/32x32.png build/icon.iconset/icon_16x16@2x.png
cp build/icons/32x32.png build/icon.iconset/icon_32x32.png
cp build/icons/64x64.png build/icon.iconset/icon_32x32@2x.png
cp build/icons/128x128.png build/icon.iconset/icon_128x128.png
cp build/icons/256x256.png build/icon.iconset/icon_128x128@2x.png
cp build/icons/256x256.png build/icon.iconset/icon_256x256.png
cp build/icons/512x512.png build/icon.iconset/icon_256x256@2x.png
cp build/icons/512x512.png build/icon.iconset/icon_512x512.png
cp build/icons/1024x1024.png build/icon.iconset/icon_512x512@2x.png

# If on macOS, use iconutil to create .icns
if [[ "$OSTYPE" == "darwin"* ]]; then
  iconutil -c icns build/icon.iconset -o build/icon.icns
else
  # On Linux/Windows, use ImageMagick to create .icns
  magick "build/icons/16x16.png" "build/icons/32x32.png" "build/icons/48x48.png" "build/icons/128x128.png" "build/icons/256x256.png" "build/icons/512x512.png" -background none "build/icon.icns"
fi

# Clean up temporary iconset directory
rm -rf build/icon.iconset
