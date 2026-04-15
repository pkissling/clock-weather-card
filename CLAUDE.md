# clock-weather-card

## Package manager

Use `yarn` (not `npm`) for all dependency and script commands.

## Verification after changes

After every change, run the following commands to verify:

```
yarn test:e2e
yarn build
yarn lint
```

## Playwright snapshots

If Playwright snapshots need to be updated, always regenerate them via `yarn test:e2e:update-snapshots`. This runs the tests inside a Linux Docker container so snapshots match those produced by GitHub Actions. Running Playwright directly on the host OS produces snapshots that diverge from CI.

## README maintenance

After implementing a feature or fixing a bug, always check whether `README.md` needs to be amended to reflect the change (e.g. new/changed configuration options, behavior, usage instructions, screenshots). If it does, update it as part of the same change.
