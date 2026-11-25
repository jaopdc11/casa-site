# Casa — Android app

Thin Capacitor shell that opens the live site (`https://casa.jaopd.dev`) in a WebView.
Front-end deploys show up in the app with no rebuild; a new APK is only needed when the native
code changes. Distributed as a signed APK only (no Play Store). Same structure as the Orçamento
shell.

## What the native side does

- **Navigation:** the site runs inside the WebView without `server.allowNavigation`, so it never
  gets access to the Capacitor bridge (`NavegacaoPlugin`). Other domains open in the browser.
- **App lock:** fingerprint or device PIN/pattern on cold start and after more than 5 minutes in
  the background (`Trava`). Local only; it does not replace the site login. Devices with no screen
  lock configured open straight away.
- Edge-to-edge insets (padding on the WebView container), back button through WebView history
  (closes the app when it reaches the local entry page), no backup or device transfer of app
  data, third-party cookies accepted so the API session cookie works.

## Future work

- **Push notifications:** not included. The Casa API has no push endpoint yet, so there is no
  Firebase, no `google-services` plugin and no notification permission. When the API gets one,
  port `Avisos`/`AvisosService` from the Orçamento shell (FCM token registered with the WebView
  session cookie).

## Icons

Launcher icons and splash are generated from the site's `public/favicon.svg`:

```sh
python3 scripts/gerar-icones.py   # needs Pillow and cairosvg
```

## Signing

The release keystore lives outside the repo, in `casa-android-keys/` next to `casa-site/`
(`web/casa-android-keys/credenciais.properties` with `STORE_FILE`, `STORE_PASSWORD`, `KEY_ALIAS`,
`KEY_PASSWORD`; `STORE_FILE` is relative to that folder). Without it, release builds are signed
with the machine's debug key: fine for testing, but an APK signed with a different key will not
update an installed one. Create the keystore once and keep it backed up:

```sh
keytool -genkeypair -v -keystore casa.jks -alias casa -keyalg RSA -keysize 4096 -validity 10000
```

## Build

```sh
npm install
npm run apk   # android/app/build/outputs/apk/release/app-release.apk
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

`android/local.properties` must point to the SDK (`sdk.dir=...`); it is git-ignored. Always judge
smoothness on the release build (baseline profiles via `profileinstaller` only apply there).
