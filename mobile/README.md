# Workora Mobile — iOS + Android wrapper

A thin native shell that loads the Workora web app (the `happy` client pattern:
one codebase serves web + iOS + Android). The web app is already PWA-installable;
this gives you real app-store presence once you have developer accounts.

## Run it

```bash
cd mobile
npm install
npx expo start        # dev server — press i for iOS, a for Android
```

## Publish to the App Store / Play Store (requires YOUR accounts)

1. Register developer accounts you own:
   - **Apple Developer** — $99/year at developer.apple.com
   - **Google Play** — $25 one-time at play.google.com/console
2. Install EAS CLI and build:
   ```bash
   cd mobile
   npm install -g eas-cli
   eas login                    # your Apple/Google-linked Expo account
   eas build --platform ios     # or android
   eas submit                   # uploads to App Store / Play Store
   ```
3. Edit `App.tsx` `WORKORA_URL` to your instance if it isn't the live one.

## Notes
- `app.json` has bundle ids `in.workora.app` (iOS + Android) — change to your org's.
- The icon/splash currently reference `./assets/icon.png` — add a real icon before publishing (1024×1024).
- Notifications/push are a future add (the `happy` pattern supports them); the web PWA already has offline caching.
