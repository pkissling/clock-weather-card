"""Mock Weather entity for E2E testing."""

from homeassistant.components.weather import (
    Forecast,
    WeatherEntity,
    WeatherEntityFeature,
)
from homeassistant.const import UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.typing import ConfigType, DiscoveryInfoType

from . import DOMAIN


async def async_setup_platform(
    hass: HomeAssistant,
    config: ConfigType,
    async_add_entities: AddEntitiesCallback,
    discovery_info: DiscoveryInfoType | None = None,
) -> None:
    """Set up the Mock Weather platform."""
    primary = MockWeatherEntity(name="Mock Weather", unique_id="mock_weather_test")
    secondary = MockWeatherEntity(name="Mock Weather 2", unique_id="mock_weather_test_2")
    hass.data[DOMAIN]["entities"] = {
        "weather.mock_weather": primary,
        "weather.mock_weather_2": secondary,
    }
    async_add_entities([primary, secondary])


class MockWeatherEntity(WeatherEntity):
    """A controllable weather entity for testing."""

    _DEFAULT_FEATURES = (
        WeatherEntityFeature.FORECAST_DAILY | WeatherEntityFeature.FORECAST_HOURLY
    )

    def __init__(self, name: str, unique_id: str) -> None:
        """Initialize the mock weather entity."""
        self._attr_name = name
        self._attr_unique_id = unique_id
        self._attr_supported_features = self._DEFAULT_FEATURES
        self._condition: str = "sunny"
        self._temperature: float = 21.0
        self._humidity: int = 50
        self._forecast_daily: list[Forecast] = []
        self._forecast_hourly: list[Forecast] = []

    @property
    def condition(self) -> str:
        """Return the current condition."""
        return self._condition

    @property
    def native_temperature(self) -> float:
        """Return the temperature."""
        return self._temperature

    @property
    def native_temperature_unit(self) -> str:
        """Return the unit of measurement."""
        return UnitOfTemperature.CELSIUS

    @property
    def humidity(self) -> int:
        """Return the humidity."""
        return self._humidity

    async def async_forecast_daily(self) -> list[Forecast]:
        """Return the daily forecast."""
        return self._forecast_daily

    async def async_forecast_hourly(self) -> list[Forecast]:
        """Return the hourly forecast."""
        return self._forecast_hourly
