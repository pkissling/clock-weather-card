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
yarn test:e2e                                   # full suite
yarn test:e2e e2e/sections/daily-forecast.spec.ts   # single spec while iterating
yarn playwright-ui                              # interactive Playwright UI
```

- Config: `playwright.config.ts`
- Layout:
  - `e2e/config-options/<option>/` — behavior of a single top-level config option
  - `e2e/sections/` — behavior of a card section (hourly/daily forecast, ...)
  - `e2e/screenshots/` — visual regression snapshots. Keep these minimal; prefer DOM assertions. Screenshot tests are slow and are the main driver of suite runtime.
- Use `setupCard(page, opts)` from `e2e/utils/test-utils.ts` to set the card config and weather/sun state in one step. State is backed by the `mock_weather` custom integration in `e2e/ha-config/custom_components/mock_weather/` — extend it if a test needs a new mockable attribute.
- The suite is self-contained: global setup (`e2e/utils/ha-setup.ts`) builds the card, starts its own Home Assistant Docker container and tears it down afterwards. The only prerequisite is a running Docker daemon — no external services or accounts.
- Concurrent runs are safe: each run gets a uniquely named container on a random free host port and its own state file, so parallel `yarn test:e2e` invocations (e.g. in different worktrees) don't interfere with each other.
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

If Playwright snapshots need to be updated, always regenerate them via `yarn test:e2e:update-snapshots`. This runs the tests inside a Linux Docker container so snapshots match those produced by GitHub Actions. Running Playwright directly on the host OS — including `yarn test:e2e --update-snapshots` — produces snapshots that diverge from CI and will fail the next CI run. **Never** pass `--update-snapshots` to `yarn test:e2e`.

## README maintenance

After implementing a feature or fixing a bug, always check whether `README.md` needs to be amended to reflect the change. Config options are documented in the `Card Options`, `Sections Options`, `Row Options` and `Segment Types` tables; also check the `Full configuration` example, behavior descriptions, usage instructions and screenshots. If anything is affected, update it as part of the same change.

## Config validation

When introducing a new config attribute on `ClockWeatherCardConfig` (in `src/types.ts`), always extend `validateConfig` in `src/service/config-service.ts` to validate it where applicable (entity existence, enum membership, positive integer, shape of nested objects, etc.). Each invalid value should throw via `invalidConfigValue(path, value)` (from `src/utils/errors.ts`) so the card surfaces a clear error instead of silently misrendering, and add an E2E test that asserts the error message for an invalid value.

## Translations

User-facing strings live in `src/locales/<lang>.json`. Add new strings to `en.json` (the fallback); other locales may be left untranslated and will fall back to English.
