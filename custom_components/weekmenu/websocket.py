"""Websocket API for the panel (works for normal users, e.g. Michelle; read-only users can only look)."""

from __future__ import annotations

from typing import Any, Awaitable, Callable

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import dt as dt_util

from .const import DOMAIN, READ_ONLY_GROUP
from .manager import WeekmenuManager, parse_text_items


def get_manager(hass: HomeAssistant) -> WeekmenuManager:
    mgr = hass.data.get(DOMAIN)
    if mgr is None:
        raise HomeAssistantError("Weekmenu is niet geladen.")
    return mgr


def _may_write(connection) -> bool:
    user = connection.user
    return user is None or not any(g.id == READ_ONLY_GROUP for g in user.groups)


def _run(hass, connection, msg, fn: Callable[[WeekmenuManager], Any], write: bool = True) -> None:
    if write and not _may_write(connection):
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Je mag het weekmenu alleen bekijken.")
        return
    try:
        res = fn(get_manager(hass))
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "weekmenu_error", str(err))
        return
    connection.send_result(msg["id"], res if isinstance(res, dict) else None)


async def _run_async(hass, connection, msg, fn: Callable[[WeekmenuManager], Awaitable[Any]], write: bool = True) -> None:
    if write and not _may_write(connection):
        connection.send_error(msg["id"], websocket_api.ERR_UNAUTHORIZED, "Je mag het weekmenu alleen bekijken.")
        return
    try:
        res = await fn(get_manager(hass))
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "weekmenu_error", str(err))
        return
    connection.send_result(msg["id"], res if isinstance(res, dict) else None)


def _user(connection) -> str | None:
    return connection.user.name if connection.user else None


ITEM_SCHEMA = vol.Schema(
    {
        vol.Required("name"): str,
        vol.Optional("picnic_id"): vol.Any(str, None),
        vol.Optional("image_id"): vol.Any(str, None),
        vol.Optional("unit"): vol.Any(str, None),
        vol.Optional("unit_price"): vol.Any(float, int, None),
    },
    extra=vol.REMOVE_EXTRA,
)


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/subscribe"})
@callback
def ws_subscribe(hass, connection, msg):
    try:
        mgr = get_manager(hass)
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "not_loaded", str(err))
        return

    @callback
    def forward() -> None:
        connection.send_message(
            websocket_api.event_message(msg["id"], {**mgr.snapshot(), "can_edit": _may_write(connection)})
        )

    connection.subscriptions[msg["id"]] = mgr.add_listener(forward)
    connection.send_result(msg["id"])
    forward()


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/item_qty", vol.Required("key"): str, vol.Required("qty"): vol.All(int, vol.Range(0, 99))}
)
@callback
def ws_item_qty(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.set_qty(msg["key"], msg["qty"]))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/item_removed", vol.Required("key"): str, vol.Required("removed"): bool}
)
@callback
def ws_item_removed(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.set_removed(msg["key"], msg["removed"]))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/link_item", vol.Required("key"): str, vol.Required("item"): ITEM_SCHEMA}
)
@callback
def ws_link_item(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.link_item(msg["key"], msg["item"]))


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/add_text", vol.Required("text"): str})
@callback
def ws_add_text(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.add_items(parse_text_items(msg["text"])))


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/standard_add", vol.Required("text"): str})
@callback
def ws_standard_add(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.standard_add(parse_text_items(msg["text"])))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/standard_qty", vol.Required("key"): str, vol.Required("qty"): vol.All(int, vol.Range(0, 99))}
)
@callback
def ws_standard_qty(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.standard_set(msg["key"], msg["qty"]))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/michelle_choose", vol.Optional("option_id"): vol.Any(str, None)}
)
@callback
def ws_michelle_choose(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.michelle_choose(msg.get("option_id")))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/answer", vol.Required("question_id"): str, vol.Optional("option_id"): vol.Any(str, None)}
)
@callback
def ws_answer(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.answer(msg["question_id"], msg.get("option_id")))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/answer_text", vol.Required("question_id"): str, vol.Required("text"): str}
)
@callback
def ws_answer_text(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.answer_text(msg["question_id"], msg["text"]))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "weekmenu/feedback",
        vol.Required("recipe_id"): str,
        vol.Required("rating"): int,
        vol.Optional("note"): vol.Any(str, None),
    }
)
@callback
def ws_feedback(hass, connection, msg):
    _run(
        hass, connection, msg, lambda m: m.recipe_feedback(msg["recipe_id"], msg["rating"], _user(connection), msg.get("note"))
    )


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/choose_day", vol.Required("day"): str, vol.Optional("choice"): vol.Any(str, None)}
)
@callback
def ws_choose_day(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.choose_day(msg["day"], msg.get("choice")))


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/search", vol.Required("query"): str})
@websocket_api.async_response
async def ws_search(hass, connection, msg):
    async def go(m: WeekmenuManager):
        return {"query": msg["query"], "results": await m.search(msg["query"])}

    await _run_async(hass, connection, msg, go, write=False)


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/request_recipes", vol.Required("day"): str, vol.Optional("wish"): vol.Any(str, None)}
)
@websocket_api.async_response
async def ws_request_recipes(hass, connection, msg):
    await _run_async(hass, connection, msg, lambda m: m.request_recipes(msg["day"], msg.get("wish")))


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/price_check"})
@websocket_api.async_response
async def ws_price_check(hass, connection, msg):
    await _run_async(hass, connection, msg, lambda m: m.price_check())


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/apply_prices", vol.Required("changes"): [dict]})
@callback
def ws_apply_prices(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.apply_prices(msg["changes"]))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "weekmenu/add_item",
        vol.Required("item"): ITEM_SCHEMA,
        vol.Optional("qty", default=1): vol.All(int, vol.Range(1, 99)),
        vol.Optional("target", default="week"): vol.In(["week", "standard"]),
    }
)
@callback
def ws_add_item(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.add_item(msg["item"], msg["qty"], msg["target"]))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/answer_item", vol.Required("question_id"): str, vol.Required("item"): ITEM_SCHEMA}
)
@callback
def ws_answer_item(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.answer_item(msg["question_id"], msg["item"]))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/approve", vol.Optional("allow_open_days", default=True): bool}
)
@websocket_api.async_response
async def ws_approve(hass, connection, msg):
    await _run_async(hass, connection, msg, lambda m: m.approve(allow_open_days=msg["allow_open_days"]))


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/reopen"})
@callback
def ws_reopen(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.reopen())


@websocket_api.websocket_command(
    {
        vol.Required("type"): "weekmenu/timer_start",
        vol.Required("seconds"): vol.All(int, vol.Range(5, 6 * 3600)),
        vol.Optional("label", default="Timer"): str,
        vol.Optional("recipe_id"): vol.Any(str, None),
    }
)
@callback
def ws_timer_start(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.timer_start(msg["seconds"], msg["label"], _user(connection), msg.get("recipe_id")))


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/timer_stop", vol.Required("id"): str})
@callback
def ws_timer_stop(hass, connection, msg):
    _run(hass, connection, msg, lambda m: m.timer_stop(msg["id"]))


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/client_report", vol.Required("report"): dict})
@callback
def ws_client_report(hass, connection, msg):
    """What a panel sees on its device (version, size, theme); kept in memory for diagnostics."""
    mgr = get_manager(hass)
    user = _user(connection) or "?"
    mgr.clients[f"{user}|{str(msg['report'].get('ua', ''))[:60]}"] = {"user": user, "at": dt_util.utcnow().isoformat(), **msg["report"]}
    connection.send_result(msg["id"])


WS_COMMANDS = (
    ws_client_report,
    ws_subscribe,
    ws_item_qty,
    ws_item_removed,
    ws_link_item,
    ws_add_text,
    ws_standard_add,
    ws_standard_qty,
    ws_michelle_choose,
    ws_answer,
    ws_answer_text,
    ws_feedback,
    ws_choose_day,
    ws_search,
    ws_price_check,
    ws_request_recipes,
    ws_apply_prices,
    ws_add_item,
    ws_answer_item,
    ws_approve,
    ws_reopen,
    ws_timer_start,
    ws_timer_stop,
)


@callback
def async_register(hass: HomeAssistant) -> None:
    for cmd in WS_COMMANDS:
        websocket_api.async_register_command(hass, cmd)
