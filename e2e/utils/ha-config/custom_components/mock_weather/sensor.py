"""Mock sensor with an entity registry entry, so registry options like display_precision apply."""

from homeassistant.components.sensor import SensorEntity
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
    """Set up the Mock Sensor platform."""
    sensor = MockSensorEntity()
    hass.data[DOMAIN]["sensors"] = {"sensor.mock_sensor": sensor}
    async_add_entities([sensor])


class MockSensorEntity(SensorEntity):
    """A controllable sensor for testing."""

    _attr_name = "Mock Sensor"
    _attr_unique_id = "mock_sensor_test"
