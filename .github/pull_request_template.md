<!-- Title: Conventional Commit, e.g. `fix(forecast): keep the bar track visible` -->

## What and why

Closes #  <!-- bug --> / Discussion:  <!-- feature, required, see CONTRIBUTING.md -->

## Checklist

- [ ] E2E test covering the change (unit/component test only if E2E is impractical)
- [ ] `yarn lint`, `yarn build`, `yarn test:unit`, `yarn test:e2e` pass
- [ ] New config option: validated in `validateConfig`, added to the editor (`src/editor/fields.ts`) and documented in README.md
- [ ] New strings translated in every locale file
- [ ] Visual change: snapshots and previews regenerated with `yarn test:e2e:update-snapshots`
