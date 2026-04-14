# Flappy Sausage Android Build

This repo packages the existing web game inside a Capacitor Android shell. The web game is still the same `index.html` + `styles.css` + `game.js`; Capacitor only wraps the built output in `dist/`.

## Prerequisites

- Node.js 20+ and npm
- Java Development Kit 17 or newer
  - Important: Java 8 is too old for a modern Android build
- Android Studio
- Android SDK Platform 35
- An Android phone with Developer Options and USB debugging enabled

## Install Commands

Run these from the repo root:

```powershell
cmd /c npm install
cmd /c npm run build
cmd /c npx cap sync android
```

## Build Commands

Build the web output:

```powershell
cmd /c npm run build
```

Sync web assets into the Android project:

```powershell
cmd /c npm run cap:sync
```

Build a debug APK:

```powershell
cmd /c npm run android:debug
```

Install the debug build to a connected phone:

```powershell
cmd /c npm run android:install
```

## Capacitor Commands

Open the Android project in Android Studio:

```powershell
cmd /c npm run cap:open:android
```

If the Android platform ever needs to be recreated from scratch:

```powershell
cmd /c npx cap add android
```

## Android Studio Workflow

1. Install JDK 17+ and point Android Studio and `JAVA_HOME` at it.
2. Open Android Studio.
3. Open the `android` folder from this repo, or run:

```powershell
cmd /c npm run cap:open:android
```

4. Let Android Studio finish Gradle sync.
5. If prompted, install missing SDK components for API 35.
6. Select a connected device or emulator.
7. Run the `app` configuration.

## Running On A Real Android Phone

1. On the phone, enable Developer Options.
2. Enable USB debugging.
3. Connect the phone by USB.
4. Accept the computer authorization prompt on the phone.
5. In Android Studio, select the device and press Run.

You can also use the command line after the phone is visible to `adb devices`:

```powershell
cmd /c npm run android:install
```

## Manual Steps Still Needed

- Install JDK 17 or newer before trying to build.
- Open Android Studio once so it can create `android/local.properties` and finish SDK setup.
- Replace the default Android launcher icons before shipping.
- Configure signing for release builds.
- For Google Play release:
  - keep `targetSdkVersion` at 35 or higher
  - build an Android App Bundle from Android Studio
  - use Play App Signing

## Game-Specific Notes

- Orientation is locked to portrait in `android/app/src/main/AndroidManifest.xml` because the current game layout is portrait-first.
- The device screen is kept awake in `android/app/src/main/java/com/slurms666/flappysausage/MainActivity.java`.
- Fullscreen / immersive mode should be handled in `MainActivity.java` if you want to hide status and navigation bars more aggressively later.
- Back button behavior is currently sane for this single-screen game: there is no in-app navigation stack, so Android back returns out of the app rather than navigating through fake pages.
- Touch input stays in the web game, and the existing tap-to-flap plus jump chime behavior is preserved inside the Capacitor shell.
