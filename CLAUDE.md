# clock-weather-card

## Package manager

Use `yarn` (not `npm`) for all dependency and script commands.

## Testing

**MANDATORY: Every new feature, bug fix, or behavioral change MUST include tests. Changes without adequate test coverage will not be accepted.**

### Unit Tests (Vitest)

```
yarn test:unit          # run once
yarn test:unit:watch    # watch mode
```

- Location: `test/unit/`
- Config: `vitest.config.ts` (inherits path aliases from `vite.config.ts`)
- Component-level tests use jsdom (`// @vitest-environment jsdom` at top of file) and mock Lit/HA dependencies.

### E2E Tests (Playwright)

```
yarn test:e2e           # run Playwright with live HA Docker instance
yarn playwright-ui      # interactive Playwright UI
```

- Location: `e2e/`
- Config: `playwright.config.ts`
- Tests run against a real Home Assistant instance (Docker-based, managed by global setup/teardown).
- Uses `setupCardTest()` from `e2e/utils/test-utils.ts` for card config and state setup.
- **ALWAYS run `yarn test:e2e` — the suite is fully self-contained.** The global setup spins up its own Home Assistant Docker container and tears it down afterwards. There are no external services, accounts, or manual prerequisites. Never skip the e2e run.

### What to test

When adding new functionality:

1. **Unit tests** — cover all branches and edge cases of new/changed functions and services.
2. **Component tests** — verify the component integrates the new logic correctly (timer behavior, config merging, rendering).
3. **E2E tests** — verify the feature works end-to-end in a browser with the built card against a live HA instance.

## Verification after changes

After every change, run the following commands to verify:

```
yarn test:unit
yarn test:e2e
yarn build
yarn lint
```

## Playwright snapshots

If Playwright snapshots need to be updated, always regenerate them via `yarn test:e2e:update-snapshots`. This runs the tests inside a Linux Docker container so snapshots match those produced by GitHub Actions. Running Playwright directly on the host OS — including `yarn test:e2e --update-snapshots` — produces snapshots that diverge from CI and will fail the next CI run. **Never** pass `--update-snapshots` to `yarn test:e2e`.

## README maintenance

After implementing a feature or fixing a bug, always check whether `README.md` needs to be amended to reflect the change (e.g. new/changed configuration options, behavior, usage instructions, screenshots). If it does, update it as part of the same change.
