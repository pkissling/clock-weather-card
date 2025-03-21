type ClockWeatherCardConfig = {
  entity: string
  title: string
}

type ClockWeatherCard = HTMLElement & {
  hass?: HomeAssistant
  config?: ClockWeatherCardConfig
}

type ClockWeatherCardCustomElement = typeof ClockWeatherCard & {
  setConfig(config: ClockWeatherCardConfig): void
} & Omit<'config'>
