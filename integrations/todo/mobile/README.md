# to do list Android — React Native + Expo

This is a real native React Native interface (not a WebView). It shares the pure task/timer/date logic from `../src/domain.ts` with the web app, while storing native data in SQLite. Android task data is separate from web/PWA task data. No server or network is needed after installation.

```sh
cd mobile
npm install
npx expo start
```

To produce a standalone installable APK with bundled JS (not an Expo Go or Metro-dependent development build):

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

The `preview` profile explicitly uses Android `buildType: apk`; download the completed APK and put it in the web project's `public/downloads/to-do-list.apk`. Run the web build and deploy. EAS needs your Expo account; no account credentials are included here.

For local builds, install Java 17 and Android SDK, run `npx expo prebuild --platform android`, then build with Gradle. Keep a private release signing key for production updates; do not commit it. Native timers are reconstructed from stored deadlines on app resume; this version does not implement background alarms. Android date entry uses ISO Gregorian dates and shows a Persian date preview.

## Included local build

The downloadable demonstration APK is built using the release variant (bundled Hermes JavaScript, `DEBUG=false`), signed with Expo's standard Android demonstration/debug signing key. It is for direct testing and portfolio demonstration. Before publishing a production/store release, configure and keep your own private signing key; this sample key must not be treated as a production secret.

A standalone demo APK can also be rebuilt locally with `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a` from `mobile/android/`. No Expo login is needed for a local Gradle build.

To connect a rebuilt verified APK to the website:

```sh
# from the repository root
node scripts/package-apk.mjs /absolute/path/to/app-release.apk
npm run build
```

The web download combines hosting-sized binary parts into one APK, checks its full SHA-256, and downloads `to-do-list.apk`. APK files are excluded from the PWA offline precache, so installing the web app does not download the Android app too.

## Updating the UI in the existing local APK

For changes limited to `App.tsx` or shared JavaScript logic, the existing native
runtime can be retained. Use the locked mobile dependencies, export a production
bundle with `expo export:embed`, and compile it with the matching React Native
Hermes compiler (`-O -output-source-map -emit-binary`). Run from the project root:

```sh
python scripts/repack-apk.py original.apk index.android.bundle unsigned.apk --optimize
zipalign -P 16 4 unsigned.apk aligned.apk
apksigner sign --ks mobile/android/app/debug.keystore --out to-do-list.apk aligned.apk
apksigner verify --verbose --print-certs to-do-list.apk
zipalign -c -P 16 4 to-do-list.apk
node scripts/package-apk.mjs to-do-list.apk
npm run build
```

The repacker rejects mismatched Hermes bytecode versions and verifies that only
`assets/index.android.bundle` changes. Optimization recompresses already
compressed entries losslessly; native libraries stay uncompressed. Confirm the
signing certificate matches the previous APK and every referenced bundle asset
already exists in its resources. Changes to native dependencies, permissions,
resources, or app configuration require a full Gradle build instead.

For an app-name-only update, `scripts/repack-apk.py --app-name "to do list"`
also updates the existing app label in the compiled Android resource table and
the bundled Expo name. Resource IDs, package identity and all other strings are
preserved. Verify `aapt2 dump resources` changes only `string/app_name`, and check
`aapt2 dump badging` reports the new application label before signing.
