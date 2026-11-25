"""Services for Claude, automations and actionable notifications."""

from __future__ import annotations

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse, callback
from homeassistant.helpers import config_validation as cv

from .const import DOMAIN
from .manager import parse_text_items
from .websocket import get_manager


@callback
def async_register(hass: HomeAssistant) -> None:
    async def import_plan(call: ServiceCall) -> ServiceResponse:
        return get_manager(hass).import_plan(call.data["plan"], call.data.get("standard_items"))

    async def get_context(call: ServiceCall) -> ServiceResponse:
        return get_manager(hass).context()

    async def choose_day(call: ServiceCall) -> ServiceResponse:
        return get_manager(hass).choose_day(call.data["day"], call.data.get("choice"))

    async def approve(call: ServiceCall) -> ServiceResponse:
        return await get_manager(hass).approve(allow_open_days=call.data["allow_open_days"])

    async def add_text(call: ServiceCall) -> None:
        get_manager(hass).add_items(parse_text_items(call.data["text"]))

    async def michelle_choose(call: ServiceCall) -> None:
        get_manager(hass).michelle_choose(call.data.get("option_id"))

    async def answer(call: ServiceCall) -> None:
        if call.data.get("text"):
            get_manager(hass).answer_text(call.data["question_id"], call.data["text"])
        else:
            get_manager(hass).answer(call.data["question_id"], call.data.get("option_id"))

    async def set_preferences(call: ServiceCall) -> None:
        mgr = get_manager(hass)
        mgr.data["preferences"] = {**mgr.data.get("preferences", {}), **call.data["preferences"]}
        mgr.changed()

    async def add_options(call: ServiceCall) -> ServiceResponse:
        return get_manager(hass).add_options(
            call.data["day"], call.data["recipes"], call.data.get("items"), call.data.get("week")
        )

    reg = hass.services.async_register
    reg(
        DOMAIN,
        "import_plan",
        import_plan,
        schema=vol.Schema({vol.Required("plan"): dict, vol.Optional("standard_items"): list}),
        supports_response=SupportsResponse.OPTIONAL,
    )
    reg(
        DOMAIN,
        "add_options",
        add_options,
        schema=vol.Schema(
            {
                vol.Required("day"): cv.string,
                vol.Required("recipes"): [dict],
                vol.Optional("items"): [dict],
                vol.Optional("week"): cv.string,
            }
        ),
        supports_response=SupportsResponse.OPTIONAL,
    )
    reg(DOMAIN, "get_context", get_context, supports_response=SupportsResponse.ONLY)
    reg(
        DOMAIN,
        "approve",
        approve,
        # from a notification or automation: don't silently drop the recipes of days without a choice
        schema=vol.Schema({vol.Optional("allow_open_days", default=False): cv.boolean}),
        supports_response=SupportsResponse.OPTIONAL,
    )
    reg(
        DOMAIN,
        "choose_day",
        choose_day,
        schema=vol.Schema({vol.Required("day"): cv.string, vol.Optional("choice"): vol.Any(cv.string, None)}),
        supports_response=SupportsResponse.OPTIONAL,
    )
    reg(DOMAIN, "add_text", add_text, schema=vol.Schema({vol.Required("text"): cv.string}))
    reg(DOMAIN, "michelle_choose", michelle_choose, schema=vol.Schema({vol.Optional("option_id"): vol.Any(cv.string, None)}))
    reg(
        DOMAIN,
        "answer",
        answer,
        schema=vol.Schema(
            {
                vol.Required("question_id"): cv.string,
                vol.Optional("option_id"): vol.Any(cv.string, None),
                vol.Optional("text"): cv.string,
            }
        ),
    )
    reg(DOMAIN, "set_preferences", set_preferences, schema=vol.Schema({vol.Required("preferences"): dict}))
