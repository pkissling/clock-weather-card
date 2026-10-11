# Contributing

Before working on a new feature, please discuss it in [Feature requests](https://github.com/pkissling/clock-weather-card/discussions/categories/feature-requests) first. Issues are for bugs only.

## Development

### Setup

Prerequisites: [Node.js](https://nodejs.org/) 24 (see `.nvmrc`), [Yarn](https://yarnpkg.com/) 4 (via `corepack enable`) and [Docker](https://www.docker.com/) for the E2E tests.

```bash
git clone https://github.com/pkissling/clock-weather-card.git
cd clock-weather-card
yarn install
```

### Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Serve the dev build for testing in Home Assistant (see [Try it in Home Assistant](#try-it-in-home-assistant)) |
| `yarn build` | Type-check and build the production bundle into `dist/` |
| `yarn lint` | Run ESLint with auto-fix |
| `yarn test:unit` | Run the Vitest unit tests (`yarn test:unit:watch` for watch mode) |
| `yarn test:e2e` | Run the Playwright E2E tests against a real Home Assistant, inside the pinned Linux Docker image used by CI |
| `yarn test:e2e:host` | Run the E2E tests on the host, skipping screenshot comparisons |
| `yarn playwright-ui` | Open the Playwright UI for interactive debugging (host, no screenshot comparisons) |
| `yarn test:e2e:update-snapshots` | Regenerate the Playwright screenshots in the Docker image |

Before opening a pull request, run `yarn lint`, `yarn build`, `yarn test:unit` and `yarn test:e2e`.

### Try it in Home Assistant

`yarn dev` registers the card as `clock-weather-card-dev`, so it runs next to the released card without conflicts.

1. Run `yarn dev`.
2. In Home Assistant, go to **Settings → Dashboards → ⋮ → Resources** and add `http://<your-machine>:5173/src/clock-weather-card-dev.js` as a **JavaScript module**.
3. Add a card with `type: custom:clock-weather-card-dev`.

Changes reload on refresh. If Home Assistant is served over HTTPS, the browser blocks the plain-HTTP resource.

### E2E tests

The E2E suite is self-contained: global setup (`e2e/utils/ha-setup.ts`) builds the card, starts a Home Assistant container with the card installed, completes onboarding, runs the tests and tears the container down again. The only prerequisite is a running Docker daemon.

A custom `mock_weather` integration (`e2e/utils/ha-config/custom_components/mock_weather/`) provides a controllable weather entity. Tests set weather state, forecasts and sun position via the Home Assistant API, using the `setupCard` fixture.

### Screenshots

Visual regression tests compare Playwright screenshots. They only run inside the Docker image, so snapshots match CI on every platform. After a visual change, regenerate them either:

- **Locally** with `yarn test:e2e:update-snapshots`, or
- **In CI** by running the **Update Playwright Snapshots** workflow from the Actions tab, which commits the updated snapshots to the current branch.

## New features

Every line of code has to be maintained for as long as the card exists, so a feature that works is not automatically a feature that gets merged. Before you start, open a discussion in [Feature requests](https://github.com/pkissling/clock-weather-card/discussions/categories/feature-requests) and show that others would use the feature too, e.g. through upvotes and comments from other users. Pull requests for features without that evidence may be declined, however well they are implemented.

Every new feature or bug fix needs an [E2E test](#e2e-tests) that proves it works as expected. Pull requests without one won't be merged. Use the `setupCard` fixture and pass only what the test depends on - it defaults to a fully populated card. For example, from [`e2e/config-options/title/title.spec.ts`](e2e/config-options/title/title.spec.ts):

```ts
import { expect, test } from '../../utils/fixtures'

test('renders the configured title in the card header', async ({ clockWeatherCard, setupCard }) => {
  await setupCard({ cardConfig: 'title: My Weather' })

  await expect(clockWeatherCard.locator('h1.card-header')).toHaveText('My Weather')
})
```

Place the spec under `e2e/config-options/<option>/` for a config option or `e2e/sections/` for section behavior. If you add a config option, also document it in [Configuration](README.md#configuration).

## Translations

The card is available in multiple languages. Translation files are located in [`src/locales/`](src/locales/), with each language stored as a separate JSON file (e.g. `en.json`, `de.json`, `fr.json`). Strings of the visual editor live in [`src/locales/editor/`](src/locales/editor/), with the same file names.

The card automatically picks the language configured in your Home Assistant instance. If no matching translation is found, it falls back to English.

To add a new language or improve an existing translation:

1. **New language:** Copy `src/locales/en.json` to `src/locales/<language-code>.json` and translate the values.
2. **Update existing translation:** Edit the corresponding file in `src/locales/`.

Use lowercase [BCP 47 language tags](https://en.wikipedia.org/wiki/IETF_language_tag) for the filename (e.g. `pt-br.json`, `zh-hans.json`).
