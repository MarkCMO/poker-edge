# Poker Edge - build and submit to Apple (from Windows)

You are on Windows, so the iOS binary is built and submitted in the cloud by EAS
on Apple hardware. No Mac is required. Everything below runs from this folder.

## 0. One-time account setup
- Apple Developer Program membership (the MarkCMO account, same one used for
  Prompterly / Calculator Plug).
- An Expo account (owner is already set to `markgabrielli` in app.json).
- The ASC API key is already referenced in eas.json and is the same shared
  whole-account key used by your other apps:
  `C:/Users/13219/Downloads/AuthKey_YRMDQTX998.p8` (key id YRMDQTX998).

```powershell
npm install -g eas-cli   # if not already installed
eas login
```

## Status (already done)
- EAS project created: `@markgabrielli/poker-edge`
  (projectId `b961a6ca-1c7b-4ef1-8042-97bd808843be`, set in app.json).
- Reference API live on Cloudflare, backed by Supabase:
  `https://pokeredge-api.marklgabriellijr.workers.dev` (serving 12 rooms,
  11 tournaments, 4 series from the DB). app.json `extra.apiBaseUrl` points at it.
  Supabase project `poker-edge` (ref `bscfefcytqwmpuuenuqi`, MarkCMO org); schema
  applied, secrets set on the Worker, daily ingestion cron set. Falls back to the
  bundled seed automatically on any DB error.
- App Store Connect API key verified working (eas.json submit config). The app
  record will be auto-created by `eas submit`.
- App Store screenshots ready: `store-assets/screenshots/*.png`, five 1290x2796
  (6.7-inch) images. Upload as-is.

## 1. Remaining placeholders
1. RevenueCat (only needed for Pro purchases; the app builds and runs without it).
   Create a RevenueCat project, add an entitlement called exactly `pro`, create an
   offering with monthly and annual packages mapped to your App Store Connect
   subscription products, then paste the iOS public SDK key into app.json
   `extra.revenueCatIosKey` (replaces `REPLACE_WITH_REVENUECAT_IOS_KEY`).

## 2. Create the subscription products (App Store Connect)
Required for Pro to be purchasable. In App Store Connect > your app >
Subscriptions, create a subscription group "Poker Edge Pro" with two products:
- Monthly auto-renewable (for example `pokeredge.pro.monthly`)
- Annual auto-renewable, discounted (for example `pokeredge.pro.annual`)
Pricing is set here, never in code. Then map both to the RevenueCat offering.

## 3. Build the iOS app (cloud) - THE ONE STEP THAT NEEDS YOU
A headless build was attempted and stopped at: "Distribution Certificate is not
validated for non-interactive builds." Generating the iOS signing certificate
requires authenticating to Apple (2FA), which cannot be automated. Do ONE of:

Option A (interactive, simplest - run it yourself once):
```powershell
eas build --platform ios --profile production
```
It will ask you to log into Apple, reuse or create the distribution certificate
and provisioning profile, then build. Future builds are non-interactive.

Option B (fully non-interactive - provide an Apple app-specific password):
```powershell
$env:EXPO_APPLE_ID = "your-apple-id@email.com"
$env:EXPO_APPLE_APP_SPECIFIC_PASSWORD = "xxxx-xxxx-xxxx-xxxx"   # appleid.apple.com
eas build --platform ios --profile production --non-interactive
```

The build runs on a Mac in the cloud and produces a signed .ipa.

## 4. Submit to App Store Connect / TestFlight
```powershell
eas submit --platform ios --profile production --latest
```
This uploads the latest build using the ASC API key already in eas.json.

## 5. Finish the listing in App Store Connect
- Copy the listing fields from `store-assets/STORE-LISTING.md`.
- Paste `store-assets/APP-REVIEW-NOTES.md` into App Review Information > Notes.
  This is important: it states the trainer is study-only and there is no
  real-money gambling (Guideline 5.3).
- Set the age rating to 17+.
- Add the Privacy Policy URL and complete the App Privacy questionnaire
  (data is stored on-device; no account; reads public reference data only).
- Upload screenshots (6.7-inch required). Capture them from a TestFlight build on
  a device or simulator, or design them. The five core screens to show:
  Sessions (live session), Analytics, Schedule, Rooms (with score), Study.
- Submit for review.

## Useful local checks (run before each build)
```powershell
npm run typecheck      # tsc --noEmit, should be clean
npx expo-doctor        # all checks should pass
npx expo export --platform ios --output-dir dist-check   # full bundle smoke test
```

## OTA updates after launch
`runtimeVersion` uses the `appVersion` policy and updates point at the EAS update
URL, so JS-only fixes can ship with `eas update` without a new App Store review.

## Notes
- The placeholder app icon and splash in `assets/` are valid PNGs (navy + gold
  diamond) and will build and submit fine. Swap in final store art when ready;
  `node scripts/gen-assets.js` regenerates the placeholders.
- The server (reference data API) is optional for launch. Until it is live the
  app uses its bundled seed for Rooms and Schedule, with an "offline data" label.
  See `server/README.md` to stand it up on Cloudflare + Supabase.
