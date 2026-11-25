"""Diagnostics: the stored data (Claude token redacted)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from .const import CONF_TOKEN


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, Any]:
    mgr = entry.runtime_data
    return {
        "options": async_redact_data(dict(entry.options), {CONF_TOKEN}),
        "data": mgr.context(),
    }
