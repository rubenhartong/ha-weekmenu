"""Integration tests against a real Home Assistant (pytest-homeassistant-custom-component).

Run: pip install pytest-homeassistant-custom-component && pytest tests/ha
"""

from __future__ import annotations

from datetime import timedelta

import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.setup import async_setup_component
from homeassistant.util import dt as dt_util

DOMAIN = "weekmenu"

PLAN = {
    "week": "2026-W49",
    "delivery": "zo 6 dec 12:00",
    "order_deadline": "za 5 dec 13:00",
    "recipes": [
        {"id": "r1", "title": "Zalm", "price": 18.0, "steps": ["Oven aan", {"text": "Bak 15 min", "timer_sec": 900}]},
        {"id": "r2", "title": "Curry", "price": 12.0},
    ],
    "days": [
        {"day": "ma", "date": "2026-11-30", "options": ["r1"], "choice": None},
        {"day": "di", "date": "2026-12-01", "options": ["r2"], "choice": None},
    ],
    "items": [
        {"name": "Melk", "picnic_id": "s1", "qty": 2, "unit_price": 1.19, "source": "standard"},
        {"name": "Zalm", "picnic_id": "s11", "qty": 1, "unit_price": 7.0, "source": "recipe", "recipe_id": "r1"},
        {"name": "Kip", "picnic_id": "s13", "qty": 1, "unit_price": 5.0, "source": "recipe", "recipe_id": "r2"},
        {"name": "Bakpapier", "qty": 1, "source": "advice"},
    ],
}


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    yield


class Calls(list):
    """Recorded picnic.add_product calls; `fail` holds product ids (or '*') that fail."""

    def __init__(self) -> None:
        super().__init__()
        self.fail: set[str] = set()


@pytest.fixture
async def picnic_calls(hass: HomeAssistant, monkeypatch):
    """A 'loaded' Picnic entry and a fake picnic.add_product action."""
    from types import SimpleNamespace

    from custom_components.weekmenu import manager

    monkeypatch.setattr(manager.WeekmenuManager, "_picnic_entry", lambda self: SimpleNamespace(entry_id="pic1"))
    calls = Calls()

    async def add_product(call: ServiceCall) -> None:
        if call.data.get("product_id") in calls.fail or "*" in calls.fail:
            raise HomeAssistantError("Picnic zegt nee")
        calls.append(dict(call.data))

    hass.services.async_register("picnic", "add_product", add_product)
    return calls


@pytest.fixture
async def setup(hass: HomeAssistant):
    await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, title="Weekmenu", data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _import(hass, plan=PLAN):
    return await hass.services.async_call(DOMAIN, "import_plan", {"plan": plan}, blocking=True, return_response=True)


async def test_import_sensors_en_tijden(hass: HomeAssistant, setup) -> None:
    assert hass.states.get("sensor.weekmenu_status").state == "none"
    res = await _import(hass)
    assert res["recipes"] == 2
    await hass.async_block_till_done()
    st = hass.states.get("sensor.weekmenu_status")
    assert st.state == "proposed" and st.attributes["days_open"] == ["ma", "di"]
    deadline = dt_util.parse_datetime(hass.states.get("sensor.weekmenu_besteldeadline").state)
    assert dt_util.as_local(deadline).strftime("%Y-%m-%d %H:%M") == "2026-12-05 13:00"
    assert hass.states.get("sensor.weekmenu_bezorging").state.startswith("2026-12-06T")
    total = hass.states.get("sensor.weekmenu_totaal")
    assert float(total.state) == pytest.approx(2.38)  # alleen melk: nog geen recept gekozen
    assert total.attributes["unknown_prices"] == 1  # bakpapier zonder prijs


async def test_ongeldig_plan_noemt_de_plek(hass: HomeAssistant, setup) -> None:
    bad = {**PLAN, "items": [{"name": "Melk", "qty": "veel"}, {"name": "X", "recipe_id": "r9"}]}
    with pytest.raises(HomeAssistantError, match=r"items\[0\]\.qty"):
        await _import(hass, bad)
    bad = {**PLAN, "items": [{"name": "X", "recipe_id": "r9"}]}
    with pytest.raises(HomeAssistantError, match="r9 bestaat niet"):
        await _import(hass, bad)


async def test_akkoord_alleen_verschil_en_open_dagen(hass: HomeAssistant, setup, picnic_calls) -> None:
    await _import(hass)
    # melding/automation: open dagen -> niets doen
    res = await hass.services.async_call(DOMAIN, "approve", {}, blocking=True, return_response=True)
    assert res["blocked"] is True and res["days_open"] == ["ma", "di"] and picnic_calls == []

    await hass.services.async_call(DOMAIN, "choose_day", {"day": "ma", "choice": "r1"}, blocking=True)
    await hass.services.async_call(DOMAIN, "choose_day", {"day": "di", "choice": "none"}, blocking=True)
    res = await hass.services.async_call(DOMAIN, "approve", {}, blocking=True, return_response=True)
    assert res["added"] == 3 and res["failed"] == 0
    got = {c.get("product_id") or c.get("product_name"): c["amount"] for c in picnic_calls}
    assert got == {"s1": 2, "s11": 1, "Bakpapier": 1}
    assert hass.states.get("sensor.weekmenu_status").state == "approved"

    # nog een keer akkoord: niets dubbel
    picnic_calls.clear()
    res = await hass.services.async_call(DOMAIN, "approve", {}, blocking=True, return_response=True)
    assert res["added"] == 0 and picnic_calls == []

    # aanpassen: melk +1, zalm eruit -> alleen 1 melk erbij, zalm 'zelf weghalen'
    mgr = hass.data[DOMAIN]
    mgr.reopen()
    mgr.set_qty("p-s1", 3)
    mgr.set_removed("p-s11", True)
    res = await mgr.approve()
    assert [(c["product_id"], c["amount"]) for c in picnic_calls] == [("s1", 1)]
    assert res["to_remove"] == [{"pkey": "p:s11", "name": "Zalm", "qty": 1}]


async def test_akkoord_mislukt_helemaal(hass: HomeAssistant, setup, picnic_calls) -> None:
    await _import(hass)
    picnic_calls.fail.add("*")
    mgr = hass.data[DOMAIN]
    with pytest.raises(HomeAssistantError, match="niets in je Picnic-mandje"):
        await mgr.approve()
    assert mgr.data["plan"]["status"] == "proposed"  # niet 'in mandje' als er niets in staat
    picnic_calls.fail.clear()
    res = await mgr.approve()
    assert res["added"] == 2  # melk + bakpapier; geen recepten gekozen


async def test_gedeeltelijk_mislukt_opnieuw_alleen_de_rest(hass: HomeAssistant, setup, picnic_calls) -> None:
    await _import(hass)
    picnic_calls.fail.add("s1")
    mgr = hass.data[DOMAIN]
    res = await mgr.approve()
    assert res["failed"] == 1 and res["failures"][0]["name"] == "Melk"
    picnic_calls.fail.clear()
    picnic_calls.clear()
    res = await mgr.approve()
    assert [c.get("product_id") for c in picnic_calls] == ["s1"]


async def test_timer_gaat_af_en_verdwijnt(hass: HomeAssistant, setup) -> None:
    events = []
    hass.bus.async_listen("weekmenu_timer_finished", lambda e: events.append(e.data))
    mgr = hass.data[DOMAIN]
    t = mgr.timer_start(60, "Zalm · stap 2", by="Ruben")
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(seconds=61))
    await hass.async_block_till_done()
    assert events and events[0]["label"] == "Zalm · stap 2"
    assert mgr.data["timers"][0]["done"] is True
    async_fire_time_changed(hass, dt_util.utcnow() + timedelta(minutes=20))
    await hass.async_block_till_done()
    assert mgr.data["timers"] == []
    t = mgr.timer_start(60, "x")
    mgr.timer_stop(t["id"])
    assert mgr.data["timers"] == []


async def test_websocket_en_alleen_lezen(hass: HomeAssistant, setup, hass_ws_client, hass_read_only_access_token) -> None:
    await _import(hass)
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "weekmenu/subscribe"})
    assert (await client.receive_json())["success"]
    snap = (await client.receive_json())["event"]
    assert snap["plan"]["week"] == "2026-W49" and snap["can_edit"] is True
    assert "preferences" not in snap and "feedback" not in snap  # geen leerdata naar het paneel
    assert snap["view"]["summary"]["unknown_prices"] == 1

    ro = await hass_ws_client(hass, hass_read_only_access_token)
    await ro.send_json_auto_id({"type": "weekmenu/item_qty", "key": "p-s1", "qty": 5})
    msg = await ro.receive_json()
    assert not msg["success"] and msg["error"]["code"] == "unauthorized"

    await client.send_json_auto_id({"type": "weekmenu/link_item", "key": "n-bakpapier", "item": {"name": "Picnic bakpapier", "picnic_id": "s77", "unit_price": 1.99}})
    msg = await client.receive_json()
    while msg["type"] == "event":  # the subscription pushes the change first
        msg = await client.receive_json()
    assert msg["success"]
    row = next(i for i in hass.data[DOMAIN].data["plan"]["items"] if i["key"] == "n-bakpapier")
    assert row["picnic_id"] == "s77" and row["unit_price"] == 1.99


async def test_ongeldige_snackkeuze_verandert_niets(hass: HomeAssistant, setup) -> None:
    plan = {**PLAN, "questions": [{"id": "kai_koek", "options": [{"id": "o1", "title": "Biscuit", "items": [{"name": "Biscuit", "picnic_id": "s5"}]}]}]}
    await _import(hass, plan)
    mgr = hass.data[DOMAIN]
    mgr.answer("kai_koek", "o1")
    before = [i["key"] for i in mgr.data["plan"]["items"]]
    with pytest.raises(HomeAssistantError):
        mgr.answer("kai_koek", "o9")
    assert [i["key"] for i in mgr.data["plan"]["items"]] == before


async def test_herstel_bijna_op_maakt_log_ongedaan(hass: HomeAssistant, setup) -> None:
    await _import(hass)
    mgr = hass.data[DOMAIN]
    mgr.set_removed("n-bakpapier", True)
    assert mgr.data["preferences"]["restock_log"][-1]["action"] == "skipped"
    mgr.set_removed("n-bakpapier", False)
    assert not [e for e in mgr.data["preferences"].get("restock_log", []) if e["action"] == "skipped"]


async def test_unload_en_diagnostics(hass: HomeAssistant, setup) -> None:
    from custom_components.weekmenu.diagnostics import async_get_config_entry_diagnostics

    await _import(hass)
    diag = await async_get_config_entry_diagnostics(hass, setup)
    assert diag["data"]["plan"]["week"] == "2026-W49"
    assert await hass.config_entries.async_unload(setup.entry_id)
    assert DOMAIN not in hass.data


async def test_migratie_oude_goedgekeurde_week(hass: HomeAssistant, hass_storage) -> None:
    """Data from 0.8: an approved plan without 'sent' -> everything counts as already in the cart."""
    old_plan = {
        "week": "2026-W48", "status": "approved", "order_deadline": "za 28 nov 13:00", "recipes": [], "days": None, "results": [],
        "items": [{"key": "p-s1", "name": "Melk", "picnic_id": "s1", "qty": 2, "unit_price": 1.0, "source": "standard", "removed": False}],
    }
    hass_storage["weekmenu"] = {"version": 1, "minor_version": 1, "key": "weekmenu", "data": {"plan": old_plan, "standard_items": [], "preferences": {}, "feedback": []}}
    await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, data={})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    mgr = hass.data[DOMAIN]
    assert mgr.data["plan"]["sent"] == {"p:s1": {"qty": 2, "name": "Melk"}}
    assert mgr.data["timers"] == []
    assert mgr.snapshot()["view"]["summary"]["to_send"] == 0
    assert mgr.data["plan"]["order_deadline_at"].startswith("2026-11-28T13:00")
