type ClockWeatherCardConfig = {
  entity_id: string
  title: string
}

type ClockWeatherCardCustomElement = HTMLElement & {
  hass?: HomeAssistant
  config?: ClockWeatherCardConfig
};

