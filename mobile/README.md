# RCJK Library Android App

This is the React Native/Expo Android app for **Library Members**. It uses the same Laravel `/api/v1` API as the Admin web application; it contains no mock production data and introduces no mobile-only backend.

## Completed Phase 6 scope

- Secure Android token storage with Expo SecureStore
- Member-only registration, login, logout, password reset, and required temporary-password update
- Home, catalog search/category filters/infinite pagination, book details, and protected borrow-request submission
- Request, current-loan, and history views with cancellation for pending requests only
- Read/unread notifications linked to the appropriate My Library tab
- Profile display/name update, password change, loading/empty/error/network states, pull-to-refresh, and duplicate-submission prevention

## Run on a wirelessly connected Android phone

The phone and computer must use the same Wi-Fi network.

1. On the phone, enable **Developer options** and then **Wireless debugging**. Android 11 or later is required for wireless pairing.
2. In Android Studio, open `mobile/android`. Open **Device Manager**, choose **Pair Devices Using Wi-Fi**, and scan the QR code (or use the six-digit pairing code) shown on the phone.
3. Start the API so the phone can reach it. From `backend/` run:

   ```powershell
   php artisan serve --host=0.0.0.0 --port=8000
   ```

   If Windows Firewall asks, allow PHP on **Private networks**. XAMPP Apache is not needed; only MySQL must be running.
4. The local [`.env`](.env) is prepared for this computer's current LAN address: `192.168.254.114`. If that address changes, update `EXPO_PUBLIC_API_URL`, then restart Metro.
5. From `mobile/`, start the Expo development server:

   ```powershell
   npm.cmd run start:lan
   ```

6. Forward the development-server port through the wireless ADB connection:

   ```powershell
   & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
   ```

7. In Android Studio select the paired phone in the device selector and press **Run**. The debug app installs on the phone and loads the JavaScript bundle from Metro.

The phone must be able to open `http://192.168.254.114:8000` on the local network. Do not use `127.0.0.1` or `localhost` in the phone configuration: those point to the phone itself. `10.0.2.2` is only for an Android emulator.

## Android Studio build

Android Studio is the preferred local build path here because it runs the Android SDK/NDK directly under your Windows account. The Codex sandbox can type-check the app but cannot execute the NDK compiler outside the workspace.

### Windows CMake path-length workaround

This repository currently lives in a long Codex workspace path. Android CMake resolves virtual-drive mappings back to that original physical path, so `subst` does **not** solve the native object-path error. Keep this repository as the source of truth and build a generated working copy at a short *physical* path instead.

From the original `mobile/` folder, run:

```powershell
.\scripts\Sync-AndroidBuildCopy.ps1 -PrepareAndroid
```

The script copies only source/configuration into `C:\Users\jttra\LibraryApp\App-Dev` by default, intentionally excluding dependencies and generated caches. It then runs `npm ci` and Expo prebuild in that short-path copy. The original repository is never modified by the script.

For later source updates, run the same command again. Open Android Studio at:

```text
C:\Users\jttra\LibraryApp\App-Dev\mobile\android
```

Use the short-path copy for Android Studio and Metro; make code changes only in the original repository. Do not make source edits directly in the build copy because the next sync will overwrite them.

For a local debug APK, use **Build > Build APK(s)** in Android Studio after Gradle sync. The normal output path is:

```text
mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

The debug APK is signed with the default Android debug key and is suitable only for local testing. Do not distribute it as a staging or production release. A later staging release requires a private upload keystore and an HTTPS API URL.

## Commands

```powershell
# Install dependencies after a clean clone
npm.cmd install

# Static TypeScript check
npm.cmd run typecheck

# Start Metro for a physical phone on the same Wi-Fi
npm.cmd run start:lan

# Generate/update Android native files after changing app.json or native plugins
npm.cmd run prebuild
```

## API URL configuration

Copy `.env.example` to `.env` when working on a different computer.

```text
# Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1

# Physical device (replace with the computer's LAN IPv4)
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000/api/v1
```

Use an HTTPS URL for staging and production. `usesCleartextTraffic` is enabled only to allow the local HTTP Laravel server during development.
