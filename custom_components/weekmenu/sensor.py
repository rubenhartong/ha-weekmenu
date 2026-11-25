"""Sensors: status, total, order deadline, delivery and tonight's dish.

Automations and dashboards read these instead of mirroring helpers (input_boolean/input_text).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util

from . import logic
from .const import DOMAIN, STATUS_APPROVED, STATUS_APPROVING, STATUS_NONE, STATUS_PROPOSED
from .manager import WeekmenuManager


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    mgr: WeekmenuManager = entry.runtime_data
    async_add_entities(
        [
            StatusSensor(mgr, entry),
            TotalSensor(mgr, entry),
            TimeSensor(mgr, entry, "order_deadline", "besteldeadline", "order_deadline_at"),
            TimeSensor(mgr, entry, "delivery", "bezorging", "delivery_at"),
            TonightSensor(mgr, entry),
        ]
    )


class WeekmenuSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, mgr: WeekmenuManager, entry: ConfigEntry, key: str, object_id: str) -> None:
        self.mgr = mgr
        self._attr_translation_key = key
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self.entity_id = f"sensor.{DOMAIN}_{object_id}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name="Weekmenu",
            manufacturer="Weekmenu",
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def plan(self) -> dict[str, Any] | None:
        return self.mgr.data.get("plan")

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(self.mgr.add_listener(self.async_write_ha_state))


class StatusSensor(WeekmenuSensor):
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = [STATUS_NONE, STATUS_PROPOSED, STATUS_APPROVING, STATUS_APPROVED]
    _attr_icon = "mdi:silverware-fork-knife"

    def __init__(self, mgr: WeekmenuManager, entry: ConfigEntry) -> None:
        super().__init__(mgr, entry, "status", "status")

    @property
    def native_value(self) -> str:
        return (self.plan or {}).get("status") or STATUS_NONE

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        plan = self.plan
        if not plan:
            return {}
        sm = logic.view(plan)["summary"]
        return {
            "week": plan.get("week"),
            "days_total": sm["days_total"],
            "days_chosen": sm["days_chosen"],
            "days_open": sm["days_open"],
            "to_send": sm["to_send"],
            "to_remove": [f"{r['qty']}× {r['name']}" for r in sm["to_remove"]],
            "failed": [r.get("name") for r in plan.get("results") or [] if not r.get("ok")],
            "approved_at": plan.get("approved_at"),
            "progress": plan.get("progress"),
        }


class TotalSensor(WeekmenuSensor):
    _attr_device_class = SensorDeviceClass.MONETARY
    _attr_native_unit_of_measurement = "EUR"
    _attr_suggested_display_precision = 2
    _attr_icon = "mdi:cart-outline"

    def __init__(self, mgr: WeekmenuManager, entry: ConfigEntry) -> None:
        super().__init__(mgr, entry, "total", "totaal")

    @property
    def native_value(self) -> float | None:
        return logic.summary(self.plan)["items_total"] if self.plan else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        if not self.plan:
            return {}
        sm = logic.summary(self.plan)
        return {"items": sm["items_count"], "unknown_prices": sm["unknown_prices"], "savings": sm["savings"]}


class TimeSensor(WeekmenuSensor):
    _attr_device_class = SensorDeviceClass.TIMESTAMP

    def __init__(self, mgr: WeekmenuManager, entry: ConfigEntry, key: str, object_id: str, field: str) -> None:
        super().__init__(mgr, entry, key, object_id)
        self._field = field
        self._attr_icon = "mdi:clock-alert-outline" if key == "order_deadline" else "mdi:truck-delivery-outline"

    @property
    def native_value(self) -> datetime | None:
        return dt_util.parse_datetime((self.plan or {}).get(self._field) or "")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        text_field = self._field.removesuffix("_at")
        return {"text": (self.plan or {}).get(text_field)}


class TonightSensor(WeekmenuSensor):
    """Dish chosen for today ('Niets koken' / 'Nog niet gekozen'); unknown when today is not in the plan."""

    _attr_icon = "mdi:pot-steam-outline"

    def __init__(self, mgr: WeekmenuManager, entry: ConfigEntry) -> None:
        super().__init__(mgr, entry, "tonight", "vanavond")

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()

        @callback
        def midnight(_now) -> None:
            self.async_write_ha_state()

        self.async_on_remove(async_track_time_change(self.hass, midnight, hour=0, minute=0, second=5))

    def _today(self) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
        today = dt_util.now().date().isoformat()
        day = next((d for d in (self.plan or {}).get("days") or [] if d.get("date") == today), None)
        if not day or day.get("choice") in (None, logic.NONE):
            return day, None
        recipe = next((r for r in self.plan.get("recipes") or [] if r.get("id") == day["choice"]), None)
        return day, recipe

    @property
    def native_value(self) -> str | None:
        day, recipe = self._today()
        if day is None:
            return None
        if recipe:
            return str(recipe.get("title"))[:255]
        return "Niets koken" if day.get("choice") == logic.NONE else "Nog niet gekozen"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        _day, recipe = self._today()
        if not recipe:
            return {}
        return {
            "recipe_id": recipe.get("id"),
            "minutes": recipe.get("minutes"),
            "emoji": recipe.get("emoji"),
            "image_url": recipe.get("image_url"),
        }
