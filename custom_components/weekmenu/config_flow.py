"""Config flow for Weekmenu: one instance; options hold the Claude link for 'Andere gerechten'."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.selector import TextSelector, TextSelectorConfig, TextSelectorType

from .const import CONF_FIRE_URL, CONF_TOKEN, DOMAIN

FIRE_URL_PREFIX = "https://api.anthropic.com/v1/claude_code/routines/"


class WeekmenuConfigFlow(ConfigFlow, domain=DOMAIN):
    """Add Weekmenu with one click."""

    VERSION = 1

    async def async_step_user(self, user_input=None) -> ConfigFlowResult:
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if user_input is not None:
            return self.async_create_entry(title="Weekmenu", data={})
        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return WeekmenuOptionsFlow()


class WeekmenuOptionsFlow(OptionsFlow):
    """Claude task link (Fire URL + token) used by the 'Andere gerechten' button."""

    async def async_step_init(self, user_input=None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        current = self.config_entry.options
        if user_input is not None:
            url = (user_input.get(CONF_FIRE_URL) or "").strip()
            token = (user_input.get(CONF_TOKEN) or "").strip() or current.get(CONF_TOKEN, "")
            if url and not (url.startswith(FIRE_URL_PREFIX) and url.endswith("/fire")):
                errors[CONF_FIRE_URL] = "invalid_url"
            elif url and not token:
                errors[CONF_TOKEN] = "token_required"
            else:
                return self.async_create_entry(data={CONF_FIRE_URL: url, CONF_TOKEN: token if url else ""})
        schema = vol.Schema(
            {
                vol.Optional(CONF_FIRE_URL, default=current.get(CONF_FIRE_URL, "")): TextSelector(
                    TextSelectorConfig(type=TextSelectorType.URL)
                ),
                # leeg laten = huidig token houden
                vol.Optional(CONF_TOKEN, default=""): TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD)),
            }
        )
        return self.async_show_form(step_id="init", data_schema=schema, errors=errors)
