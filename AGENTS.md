# clock-weather-card

## Package manager

Use `yarn` (not `npm`) for all dependency and script commands.

## Testing

**MANDATORY: Every new feature, bug fix, or behavioral change MUST include tests. Changes without adequate test coverage will not be accepted.**

**Prefer E2E tests.** Fall back only when the behavior cannot reasonably be exercised through the UI:

1. **E2E (default)** — verify the feature in a browser with the built card against a live HA instance.
2. **Unit tests (fallback)** — pure logic with many branches/edge cases that would be impractical to drive through the UI. Cover all branches of the new/changed functions and services.
3. **Component tests (fallback)** — integration logic (timer behavior, config merging, rendering) that can't be verified via E2E. These run in jsdom and mock Lit/HA dependencies.

### Unit Tests (Vitest)

```
yarn test:unit          # run once
yarn test:unit:watch    # watch mode
```

- Location: `test/unit/`
- Config: `vitest.config.ts` (inherits path aliases from `vite.config.ts`)
- Component-level tests need `// @vitest-environment jsdom` at the top of the file.

### E2E Tests (Playwright)

```
yarn test:e2e                                     # full suite
yarn test:e2e e2e/sections/forecast-list.spec.ts  # single spec while iterating
yarn test:e2e:host                                # run on the host, skipping screenshot comparisons
yarn playwright-ui                                # interactive Playwright UI (host, no screenshot comparisons)
```

- `yarn test:e2e` runs Playwright inside the pinned Linux image (`.github/playwright-snapshots-helper/Dockerfile`), the same environment as CI, so screenshot tests pass on macOS and Linux alike. Host runs (`test:e2e:host`, `playwright-ui`) set no `E2E_IN_DOCKER`, so `toHaveScreenshot` assertions are skipped there.
- Config: `playwright.config.ts`
- Layout:
  - `e2e/config-options/<option>/` — behavior of a single top-level config option
  - `e2e/sections/` — behavior of a card section (hourly/daily forecast, ...)
  - `e2e/screenshots/` — visual regression snapshots. Keep these minimal; prefer DOM assertions. Screenshot tests are slow and are the main driver of suite runtime.
- Use `setupCard(page, opts)` from `e2e/utils/test-utils.ts` to set the card config and weather/sun state in one step. Every option has a default (entity, 24 hourly + daily forecast entries, sun state, fixed date, language, time zone), so pass only what the test actually depends on — `setupCard({})` already yields a fully populated card. Extra `date`/`timeZone`/`cardConfig` options are noise that obscures what a test is about. State is backed by the `mock_weather` custom integration in `e2e/utils/ha-config/custom_components/mock_weather/` — extend it if a test needs a new mockable attribute.
- The suite is self-contained: global setup (`e2e/utils/ha-setup.ts`) builds the card, starts its own Home Assistant Docker container and tears it down afterwards. The only prerequisite is a running Docker daemon — no external services or accounts.
- Tests in a worker share one page (booting the HA frontend costs ~1.5s; a follow-up `setupCard` ~0.1s), so `setupCard` reaches the mounted card via HA's live push instead of reloading. The page is reloaded only after a failing test. A test that alters the page itself (routes, init scripts) must opt into its own page with `test.use({ freshPage: true })`.
- One e2e run per worktree: the Playwright image (`clock-weather-card-e2e-<hash>`), runner and HA containers are named after a hash of the worktree path (`clock-weather-card-e2e-<hash>-playwright`, `clock-weather-card-e2e-<hash>-ha`), so runs in different worktrees (each on a random free host port) don't interfere, while a second run in the same worktree fails fast with an "already active in this worktree" error.
- **ALWAYS run the full `yarn test:e2e` before reporting a task as done.** Iterate on a single spec while developing, but never skip the full run.

## Verification after changes

After every change, run these in order (cheapest first; `lint` auto-fixes files, so it must run before the tests see the final code):

```
yarn lint
yarn build
yarn test:unit
yarn test:e2e
```

## Playwright snapshots

If Playwright snapshots need to be updated, always regenerate them via `yarn test:e2e:update-snapshots`. This runs the tests inside the same Linux Docker image as CI so snapshots match. **Never** run `playwright test --update-snapshots` directly on the host — it produces snapshots that diverge from CI.

## README maintenance

After implementing a feature or fixing a bug, always check whether `README.md` needs to be amended to reflect the change. Config options are documented in the `Card Options`, `Sections Options`, `Row Options` and `Segment Types` tables; also check behavior descriptions, usage instructions and screenshots. If anything is affected, update it as part of the same change.

## Config validation

When introducing a new config attribute on `ClockWeatherCardConfig` (in `src/types.ts`), always extend `validateConfig` in `src/utils/config.ts` to validate it where applicable (entity existence, enum membership, positive integer, shape of nested objects, etc.). Each invalid value should throw via `invalidConfigValue(path, value)` (from `src/utils/errors.ts`) so the card surfaces a clear error instead of silently misrendering, and add an E2E test that asserts the error message for an invalid value.

## Logging

When writing code, consider whether a case deserves a log via `logger` (`src/service/logger.ts`, never `console` directly):

- `warn` — the card silently falls back or drops something because of bad entity data or a config mistake that `validateConfig` can't catch up front (missing attribute, unparseable value, unknown state, empty forecast).
- `error` — an unsupported situation the card can only paper over (e.g. an unknown temperature unit) or a failed HA call.
- `debug` — lifecycle and diagnostics (subscriptions, payloads received, clock start/stop, resolved config).

Prefer throwing a config error in `validateConfig` over warning when the mistake is detectable from config + `hass`. The logger suppresses identical messages for 3 minutes, so it is safe on render paths; put the distinguishing details (entity id, value) into the message. Don't add tests that only assert log output.

## Translations

User-facing strings live in `src/locales/<lang>.json`. When adding a new string, add a translation to every locale file, not just `en.json` (the fallback).
