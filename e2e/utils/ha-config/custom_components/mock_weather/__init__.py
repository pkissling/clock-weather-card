"""Mock Weather integration for E2E testing."""

from homeassistant.components.weather import WeatherEntityFeature
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers.discovery import async_load_platform
from homeassistant.helpers.typing import ConfigType

DOMAIN = "mock_weather"
DEFAULT_ENTITY_ID = "weather.mock_weather"


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the Mock Weather component."""
    hass.data[DOMAIN] = {}

    await async_load_platform(hass, "weather", DOMAIN, {}, config)

    async def handle_set_weather(call: ServiceCall) -> None:
        """Handle the set_weather service call."""
        entities = hass.data[DOMAIN].get("entities", {})
        entity_id = call.data.get("entity_id", DEFAULT_ENTITY_ID)
        entity = entities.get(entity_id)
        if entity is None:
            return

        if "condition" in call.data:
            entity._condition = call.data["condition"]
        if "temperature" in call.data:
            entity._temperature = call.data["temperature"]
        if "humidity" in call.data:
            entity._humidity = call.data["humidity"]
        if "forecast_daily" in call.data:
            entity._forecast_daily = call.data["forecast_daily"]
        if "forecast_hourly" in call.data:
            entity._forecast_hourly = call.data["forecast_hourly"]
        if "supported_features" in call.data:
            entity._attr_supported_features = WeatherEntityFeature(
                int(call.data["supported_features"])
            )

        entity.async_write_ha_state()

    hass.services.async_register(DOMAIN, "set_weather", handle_set_weather)

    return True
