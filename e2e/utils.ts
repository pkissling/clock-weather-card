import { Page } from '@playwright/test'
import { HomeAssistant } from 'custom-card-helpers'

export const mockState = async (
  page: Page,
  hass: HomeAssistant,
  config: ClockWeatherCardConfig,
): Promise<void> => {
  await page.waitForFunction(
    () => !!customElements.get('clock-weather-card-dev'),
  )

  await page.evaluate(
    ({ config, hass }) => {
      const element = document.getElementById(
        'clock-weather-card-dev',
      )! as ClockWeatherCardCustomElement
      element.setConfig(config)
      element.hass = hass
    },
    { config, hass },
  )
}
