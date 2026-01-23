---
description: How to version, build, and test auto-updates for the Electron app
---

# Managing Versions & Updates

## 1. Build Time

It is normal for the first build (or builds after `node_modules` changes) to take a while.
However, subsequent builds should be faster.

- **Optimization Tip**: Ensure you are not building on a cloud drive (like OneDrive/Google Drive) if possible, as file syncing slows down IO operations significantly.

## 2. Changing Version

To release a new version, you must update the `version` field in `apps/desktop/package.json`.

1. Open `apps/desktop/package.json`
2. Change `"version": "1.0.2"` to your new version (e.g., `"1.0.3"`)
3. Save the file.

## 3. Testing Auto Update

The auto-update configuration is set to check for updates at `https://app.ytrc.co.th/updates`.

### To test this flow locally:

1. **Create "Old" Version (e.g., 1.0.2)**
   - Ensure `package.json` has `"version": "1.0.2"`.
   - Run `/build-windows`.
   - Install the generated `.exe` (this is your "user" with the old version).

2. **Create "New" Version (e.g., 1.0.3)**
   - Update `package.json` to `"version": "1.0.3"`.
   - Run `/build-windows`.
   - **Do NOT install this one**.

3. **Simulate the Server**
   - Take the output files from Step 2 (the 1.0.3 build), specifically:
     - `latest.yml`
     - `YTRC-Desktop-Windows-1.0.3-Setup.exe`
   - Upload these files to your update server folder (`https://app.ytrc.co.th/updates`).
   - _Alternative for local test_: You can use a local static server (like `http-server`) to serve these files and temporarily change `electron-builder.json5` url to `http://localhost:8080`.

4. **Verify**
   - Open the installed "Old" app (1.0.2).
   - It should detect the new version on startup (checks after 3 seconds).
   - You should see the update notification (managed by `UpdateNotification.vue`).
