# PWA Icons

This directory should contain the following PWA icon files:

## Required Icons:
- `pwa-192x192.png` - 192x192 pixels for Android devices
- `pwa-512x512.png` - 512x512 pixels for high-resolution devices
- `favicon.ico` - Favicon for browsers
- `apple-touch-icon.png` - 180x180 pixels for iOS devices
- `masked-icon.svg` - SVG icon for adaptive icons on Android

## Design Guidelines:
- Use the TaskWizer brand colors: `#1a1a2e` (primary) and `#0f0f1e` (background)
- Include a browser or search icon that represents the application
- Ensure good contrast and readability
- Keep the design simple and recognizable at small sizes

## To generate icons:
1. Create a high-resolution SVG design (1024x1024)
2. Use tools like Figma, Sketch, or Adobe Illustrator
3. Export to PNG at required sizes
4. Convert to ICO format for favicon
5. Optimize for web (use tools like TinyPNG)

## Placeholder:
For development, the Vite PWA plugin will automatically generate placeholder icons if these files don't exist. However, for production deployment, please add proper branded icons.