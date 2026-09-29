# Offline Support & PWA Installation

## Features

### ✅ Install as App
The **Settings** page has an **Install App** button that allows users to install AJ Spares on their device:

- **Android**: Installs as a standalone app icon
- **iOS**: Can be added to home screen via share menu
- **Desktop**: Installable as a standalone application

### ✅ Fully Offline
Once installed, the app works offline with:

1. **Static Assets Caching**: All UI files, CSS, and JavaScript are cached
2. **Fallback Pages**: Display meaningful offline messages
3. **Data Caching**: Previously loaded data (products, sales, customers) remains accessible
4. **Service Worker**: Automatically manages caching strategies

## How It Works

### Installation Flow
1. Navigate to **Settings**
2. Click **Install App** button
3. Confirm browser install dialog
4. App installs as a standalone application on your device
5. Status updates to "Installed on this device"

### Offline Mode
- **Read Operations**: View cached products, sales history, and reports
- **Write Operations**: Require internet connection (Firebase sync)
- **Status**: App clearly indicates when offline or online
- **Automatic Sync**: When reconnected, data syncs automatically

### Caching Strategy
- **Network-first for APIs**: Tries Firebase first, falls back to cache
- **Cache-first for assets**: Uses cached UI files, fetches updates when online
- **Automatic cleanup**: Old caches are removed automatically

## Technical Details

### Service Worker (`/public/sw.js`)
- Installed on first visit
- Handles all fetch requests
- Manages cache lifecycle
- Supports background notifications

### Manifest (`/public/manifest.json`)
- Declares app metadata
- Defines install icons and screenshots
- Specifies offline-capable mode
- Sets theme colors and orientation

### Main App (`/src/main.tsx`)
- Registers service worker on load
- Handles startup errors gracefully
- Maintains service worker updates

## Deployment
Already configured for Vercel with:
- `vercel.json` SPA rewrites
- Service Worker cache headers
- Proper MIME types for manifest and SW

## Notes
- Firebase authentication still requires internet
- POS transactions require online connection
- Report generation is instant (cached data)
- All changes sync to Firestore when online
