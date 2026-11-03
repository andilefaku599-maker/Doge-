# Spotter: personal gym & diet PA

A mobile-first, offline-first Progressive Web App (PWA) for one person. Built with React, TypeScript, Vite, Dexie (IndexedDB) and Tailwind. All data lives on your phone.

> **Status: Phase 1 (gym tracker).** Diet tracking (Phase 2), the AI PA (Phase 3) and backup/export (Phase 4) come next.

## What works now

- **Today:** your next workout, calories and protein left, and one big button to start or resume.
- **Routines:** a default 4-day Upper/Lower split, an editable exercise library and custom exercises. Routines rotate in order, not by weekday, so a missed day never breaks anything.
- **Active workout:** each set is prefilled from last time, and one tap logs it. Big +/- controls, warm-ups, optional RPE, notes, swaps, and editing or deleting any set.
- **Rest timer:** starts automatically. Use −15/+15/Skip, and set a default per exercise. It is timestamp-based, so it stays correct if the phone locks or the app closes. The phone vibrates when rest ends.
- **Screen stays on** during a workout (Wake Lock).
- **Crash-proof:** every set and every +/- tap is saved immediately. Kill the app and it resumes on the same exercise, with the same numbers and the same rest timer.
- **Double progression:** hit the top of the rep range on all working sets and it suggests the next jump: 2.5 kg barbell, 2 kg dumbbell, 5 kg machine, 10 kg leg press or hack squat (editable per exercise).
- **PRs** (heaviest weight, best estimated 1RM, rep PR at a weight) and per-exercise charts.

## Run it locally

```bash
cd gym-pa
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run build      # production build in dist/
```

## Deploy to Vercel (free tier is fine)

1. Push this repo to GitHub (already done if you're reading this there).
2. Go to <https://vercel.com/new> → **Import** this repository.
3. Set **Root Directory** to `gym-pa`. This matters because the repo also contains an older, unrelated app at the root.
4. Vercel should detect **Vite**. Leave the build command (`npm run build`) and output (`dist`) as they are.
5. Click **Deploy**. You'll get a URL like `https://spotter-xyz.vercel.app`.

Each later push to the branch redeploys automatically. The app shows an **"A new version is ready"** banner, and tapping **Update** reloads it. Your data is not touched.

### Environment variables

Phase 1 needs **none**. Phase 3 will add these in Vercel → Project → Settings → Environment Variables:

| Name | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key. Server-side only, never sent to the phone. |
| `PA_PASSCODE` | Passcode the app must send to use AI features. |
| `MODEL_PARSE` | `claude-haiku-5-5` (food parsing) |
| `MODEL_REVIEW` | `claude-sonnet-5-5` (weekly review / chat) |

## Install on Android (Chrome)

1. Open your Vercel URL in **Chrome** on your phone.
2. Tap the **⋮** menu → **Add to home screen** (or **Install app**) → **Install**.
3. Open **Spotter** from your home screen. It runs full-screen, with no browser bar.
4. Long-press the icon for the **Start workout** and **Log food** shortcuts.
5. **Test offline:** open the app once while online, switch on airplane mode, close it fully and reopen it. Everything should work.

Installing also helps Chrome grant **persistent storage**, which protects your data from automatic clean-up. You can check this under Settings → Storage.

## Your starting numbers

Based on 160 cm, 119 kg, male and recomp, with **age assumed to be 35** (change it in Settings):

- Maintenance ≈ 2,930 kcal/day → starting target **2,350 kcal** (about a 20% deficit)
- Protein **180 g/day**
- Alcohol cap 3 drinks/day (counted toward calories in Phase 2)

These are estimates. Once weight logging lands in Phase 2, adjust based on your 7-day trend, not on any single day. For pain, injury or medical questions, see a professional.

## Platform limits (and what Spotter does instead)

| Requirement | Limit | What Spotter does |
|---|---|---|
| Vibrate when rest ends | Browsers can't run code or vibrate while the app is fully in the background (push notifications are out of scope). | The screen is kept on during workouts (Wake Lock), so the app stays in the foreground and vibrates on time. If you switch apps, the timer is still correct when you return. It just can't buzz while you're away. |
| Wake Lock | Android may refuse it in battery-saver mode. | Fails silently. Everything else still works. |
| Persistent storage | Chrome decides whether to grant it, based on engagement and installation. | It's requested on every launch. Phase 4 adds export plus a 7-day backup reminder as the real safety net. |

## Project layout

```
gym-pa/
  src/lib/        progression, timer, targets, db (Dexie), workout actions (+ *.test.ts)
  src/screens/    Today, Train, Workout, Progress, Settings
  src/components/ UI primitives, exercise picker, SVG chart, update prompt
  scripts/        icon source SVGs + PNG renderer
```
