"""Weekmenu: weekly groceries, recipes and cooking mode for Home Assistant.

Data lives in .storage/weekmenu (included in HA backups). Claude writes a week plan once a
week through `weekmenu.import_plan`; everything after that (choosing per day, adjusting the
list, approving, filling the Picnic cart, cooking timers) is deterministic code here and in
the panel.

Modules: manager (data and rules), logic/prices/schema (pure, unit tested), websocket (panel),
services (Claude and automations), sensor (status for automations and dashboards).
"""

from __future__ import annotations

import hashlib
from datetime import datetime
from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.frontend import async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv

from . import services, websocket
from .const import DOMAIN, PANEL_URL, STATIC_URL
from .manager import WeekmenuManager

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
PLATFORMS = [Platform.SENSOR]

FRONTEND_DIR = Path(__file__).parent / "frontend"
PANEL_FILE = "weekmenu-panel.js"

type WeekmenuConfigEntry = ConfigEntry[WeekmenuManager]


def _file_hash(path: Path) -> str:
    try:
        return hashlib.sha1(path.read_bytes()).hexdigest()[:10]
    except OSError:
        return datetime.now().strftime("%Y%m%d%H%M")


async def async_setup(hass: HomeAssistant, config) -> bool:
    websocket.async_register(hass)
    services.async_register(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: WeekmenuConfigEntry) -> bool:
    mgr = WeekmenuManager(hass)
    mgr.entry = entry
    await mgr.async_load()
    entry.runtime_data = mgr
    hass.data[DOMAIN] = mgr

    if not hass.data.get(f"{DOMAIN}_static"):
        await hass.http.async_register_static_paths([StaticPathConfig(STATIC_URL, str(FRONTEND_DIR), False)])
        hass.data[f"{DOMAIN}_static"] = True

    version = await hass.async_add_executor_job(_file_hash, FRONTEND_DIR / PANEL_FILE)
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL,
        webcomponent_name="weekmenu-panel",
        sidebar_title="Weekmenu",
        sidebar_icon="mdi:silverware-fork-knife",
        module_url=f"{STATIC_URL}/{PANEL_FILE}?v={version}",
        embed_iframe=False,
        require_admin=False,
        config={},
    )
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: WeekmenuConfigEntry) -> bool:
    if not await hass.config_entries.async_unload_platforms(entry, PLATFORMS):
        return False
    async_remove_panel(hass, PANEL_URL)
    mgr: WeekmenuManager = entry.runtime_data
    mgr.async_shutdown()
    await mgr.store.async_save(mgr.data)
    hass.data.pop(DOMAIN, None)
    return True
