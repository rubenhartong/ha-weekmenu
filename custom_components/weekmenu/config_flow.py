"""Config flow for Weekmenu: no settings, one instance."""

from __future__ import annotations

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

from .const import DOMAIN


class WeekmenuConfigFlow(ConfigFlow, domain=DOMAIN):
    """Add Weekmenu with one click."""

    VERSION = 1

    async def async_step_user(self, user_input=None) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="Weekmenu", data={})
        return self.async_show_form(step_id="user")
