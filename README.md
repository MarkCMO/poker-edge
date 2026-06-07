# Poker Edge

The serious live player's companion. Track every session and your bankroll, find
the most profitable room and game, study ranges and opponent types, and never
miss a tournament.

Built per the Poker Edge iOS Coder Playbook. Two pieces:
- **app/** + **src/** - the iOS app (Expo / React Native, SDK 54). Thin client.
- **server/** - the reference-data API and ingestion layer (Cloudflare Worker +
  Supabase). The fat server. The app NEVER scrapes; it only reads this API and
  falls back to a bundled seed offline.

## Why Expo / React Native and not native Swift
The playbook specifies native Swift. This project is developed on Windows, where
Xcode (required to compile and submit Swift) does not run. Expo builds and
submits the iOS binary in the cloud on Apple hardware via EAS, so the app can be
developed here and shipped to the App Store with no Mac. The SwiftData role is
filled by on-device SQLite (`expo-sqlite`), Swift Charts by `react-native-svg`
charts, and CloudKit by the export/own-your-data flow (a sync layer can be added
later). Every other requirement in the playbook is implemented.

## Architecture

### Offline-first (Section 5)
All user-private data (sessions, bankroll, player notes, hands) lives in
on-device SQLite and works with zero signal. Reference data (rooms, schedule) is
fetched from the API, cached, and falls back to a bundled seed, always shown with
a freshness label.

### The split (Section 0)
- The iOS binary contains no scrapers and hits only our own API.
- All source-data risk (ToS, licensing) lives server-side. The server prefers
  official feeds and licensed APIs; scraping is a documented last resort.

### Study trainer is study-only (Section 0 / 5.3)
A persistent banner states it must not be used at the table. No live in-hand
advice exists in the app.

## Feature map (playbook section -> code)
- 4.1 Sessions + live timer: `app/(tabs)/index.tsx`, `src/db/sessions.ts`
- 4.2 Analytics: `app/analytics.tsx`, `src/lib/analytics.ts`, `src/components/charts.tsx`
- 4.3 Schedule: `app/(tabs)/schedule.tsx`, `app/tournament/[id].tsx`, `src/data/seedSchedule.ts`
- 4.4 Rooms + rake: `app/(tabs)/rooms.tsx`, `app/room/[id].tsx`, `src/data/seedRooms.ts`
- 4.5 Study (ranges, matrix, quiz, equity): `app/study/*`, `src/data/ranges.ts`, `src/data/adviceMatrix.ts`, `src/lib/equity.ts`
- 4.6 Welfare tools (break, stop-loss/win, fatigue): `app/(tabs)/profile.tsx`, `src/lib/notifications.ts`, fatigue in `src/lib/analytics.ts`
- 4.7 Profile, export, settings: `app/(tabs)/profile.tsx`
- 7 Profitability score: `src/lib/profitability.ts`
- 8 Villain tracking + showdowns: `app/villain/*`, `src/db/players.ts`
- 9 Notifications: `src/lib/notifications.ts`
- 10 Age gate, privacy, responsible gaming: `app/age-gate.tsx`, `app/onboarding.tsx`
- 11 Monetization (IAP): `app/paywall.tsx`, `src/lib/purchases.ts`
- 6 Server ingestion: `server/`

## Run locally
```powershell
npm install --legacy-peer-deps
npm run typecheck          # clean
npx expo-doctor            # all checks pass
npx expo start             # open in Expo Go (SDK 54) or a dev build
```
Note: iOS cannot be built or run on Windows; use Expo Go on a phone for live
preview, or build with EAS. See SUBMIT.md.

## Ship it
See [SUBMIT.md](SUBMIT.md) for the full build-and-submit path via EAS, and
[store-assets/](store-assets/) for the App Store listing and review notes.

## Tech
Expo SDK 54, expo-router 6, React 19, React Native 0.81, expo-sqlite, zustand,
react-native-svg, react-native-purchases (RevenueCat), expo-notifications,
expo-location, expo-calendar, date-fns.
