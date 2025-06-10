# Version Management

This project uses centralized version management where the version is defined only in `package.json` and automatically propagated to all other files.

## How it works

1. **Single Source of Truth**: The version is defined only in `package.json`
2. **Electron App**: The version is read from `package.json` in `main.js` and injected into the renderer process via `window.appVersion`
3. **Browser Usage**: The version is loaded dynamically from `package.json` via fetch API
4. **Display**: All UI elements use JavaScript to display the version dynamically

## To update the version

1. Update the version in `package.json` only:
   ```json
   {
     "version": "1.0.3"
   }
   ```

2. That's it! The version will automatically update everywhere.

## Files involved

- `package.json` - Single source of truth for version
- `main.js` - Reads version and injects it into renderer (Electron)
- `index.html` - Contains script to load version from package.json (Browser)
- `renderer.js` - Updates UI elements with the version
- `build-version.js` - Script to verify version management is working correctly

## Verification

Run the version check script to ensure everything is properly configured:

```bash
npm run check-version
```

This will verify that no files contain hardcoded versions and that the dynamic loading is set up correctly.
