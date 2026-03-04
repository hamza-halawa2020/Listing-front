# Mobile Shell

This folder wraps the existing Angular web app with Capacitor without changing the Angular source code.

## Usage

1. `cd mobile-shell`
2. `npm install`
3. `npm run add:android`
4. `npm run brand:android`
5. `npm run sync:android`
6. `npm run open:android`

`sync:android` rebuilds the Angular app from the parent project, then copies the web output into the Android shell.

`brand:android` regenerates the Android app icon and splash images from `src/assets/images/logo.svg`.

## Release Build

1. Copy `android/keystore.properties.example` to `android/keystore.properties`.
2. Generate a release keystore inside `android/app`:
   `keytool -genkeypair -v -keystore app/release.keystore -alias careandshare-upload -keyalg RSA -keysize 2048 -validity 10000`
3. Replace the placeholder passwords in `android/keystore.properties` with your real values.
4. Build a signed release package:
   `npm run build:release:apk`
   or
   `npm run build:release:aab`

Outputs:

- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
