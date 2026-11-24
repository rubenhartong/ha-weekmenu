"""WeekmenuManager with minimal Home Assistant stubs: import_plan, choose_day, list edits, approve."""
import asyncio
import sys
import types
from pathlib import Path

import pytest


def _stub_ha():
    def mod(name, **attrs):
        m = types.ModuleType(name)
        m.__dict__.update(attrs)
        sys.modules[name] = m
        return m

    class HomeAssistantError(Exception):
        pass

    class Store:
        def __init__(self, *a, **k): pass
        async def async_load(self): return None
        def async_delay_save(self, *a, **k): pass

    ident = lambda f: f
    deco = lambda *a, **k: ident
    mod("homeassistant")
    mod("homeassistant.components", panel_custom=types.SimpleNamespace(), websocket_api=types.SimpleNamespace(
        websocket_command=deco, async_response=ident, event_message=lambda i, d: d, async_register_command=lambda *a: None))
    mod("homeassistant.components.frontend", async_remove_panel=lambda *a: None)
    mod("homeassistant.components.http", StaticPathConfig=object)
    mod("homeassistant.config_entries", ConfigEntry=object, ConfigEntryState=types.SimpleNamespace(LOADED="loaded"))
    mod("homeassistant.core", HomeAssistant=object, ServiceCall=object, ServiceResponse=dict,
        SupportsResponse=types.SimpleNamespace(ONLY=1, OPTIONAL=2), callback=ident)
    mod("homeassistant.exceptions", HomeAssistantError=HomeAssistantError)
    mod("homeassistant.helpers")
    mod("homeassistant.helpers.config_validation", config_entry_only_config_schema=lambda d: None, string=str)
    mod("homeassistant.helpers.storage", Store=Store)
    from datetime import datetime, timezone
    mod("homeassistant.util")
    mod("homeassistant.util.dt", utcnow=lambda: datetime.now(timezone.utc), now=lambda: datetime.now())
    sys.modules["homeassistant.util"].dt = sys.modules["homeassistant.util.dt"]
    sys.modules["homeassistant.helpers"].config_validation = sys.modules["homeassistant.helpers.config_validation"]
    return HomeAssistantError


HAErr = _stub_ha()
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "custom_components"))
pytest.importorskip("voluptuous")
import weekmenu  # noqa: E402


class FakeHass:
    def __init__(self):
        self.events, self.calls = [], []
        self.bus = types.SimpleNamespace(async_fire=lambda e, d=None: self.events.append((e, d)))
        entry = types.SimpleNamespace(state="loaded", entry_id="pic1")
        self.config_entries = types.SimpleNamespace(async_entries=lambda d: [entry])

        async def call(domain, svc, data, blocking=False):
            self.calls.append(data)
        self.services = types.SimpleNamespace(async_call=call)


PLAN = {
    "week": "2026-W49",
    "recipes": [{"id": "r1", "title": "Zalm", "price": 18.0}, {"id": "r2", "title": "Curry", "price": 12.0},
                {"id": "r4", "title": "Pasta", "price": 11.0}],
    "days": [{"day": "ma", "date": "2026-11-30", "options": ["r1", "r2"], "choice": None},
             {"day": "di", "date": "2026-12-01", "options": ["r4", "r1"], "choice": None},
             {"day": "wo", "date": "2026-12-02", "options": ["r2"], "choice": None}],
    "items": [
        {"name": "Melk", "picnic_id": "s1", "qty": 2, "unit_price": 1.19, "source": "standard"},
        {"name": "Ui", "picnic_id": "s10", "qty": 2, "unit_price": 0.5, "source": "recipe", "recipe_id": "r1", "recipe": "Zalm"},
        {"name": "Ui", "picnic_id": "s10", "qty": 1, "unit_price": 0.5, "source": "recipe", "recipe_id": "r4", "recipe": "Pasta"},
        {"name": "Zalm", "picnic_id": "s11", "qty": 1, "unit_price": 7.0, "source": "recipe", "recipe_id": "r1"},
        {"name": "Kip", "picnic_id": "s13", "qty": 1, "unit_price": 5.0, "source": "recipe", "recipe_id": "r2"},
    ],
}


def test_flow():
    hass = FakeHass()
    m = weekmenu.WeekmenuManager(hass)
    m.import_plan(PLAN, None)
    p = m.data["plan"]
    assert [i["key"] for i in p["items"]] == ["p-s1", "p-s10@r1", "p-s10@r4", "p-s11@r1", "p-s13@r2"]
    assert not any(r["selected"] for r in p["recipes"])
    assert hass.events[-1][0] == "weekmenu_plan_imported" and len(hass.events[-1][1]["days"]) == 3

    m.choose_day("ma", "r1")
    m.choose_day("di", "r4")
    m.choose_day("wo", "none")
    snap = m.snapshot()
    rows = {i["key"]: i for i in snap["view"]["items"]}
    assert rows["p-s10"]["qty"] == 3 and "p-s13" not in rows
    assert snap["view"]["summary"]["days_chosen"] == 3
    assert [r["selected"] for r in p["recipes"]] == [True, False, True]

    m.set_qty("p-s10", 4)
    assert {i["key"]: i for i in m.snapshot()["view"]["items"]}["p-s10"]["qty"] == 4
    m.set_qty("p-s1", 1)  # gewone rij werkt als voorheen

    with pytest.raises(HAErr):
        m.choose_day("wo", "r1")  # geen optie op woensdag

    m.choose_day("wo", None)
    res = asyncio.run(m.approve())
    bought = {c["product_id"]: c["amount"] for c in hass.calls}
    assert bought == {"s1": 1, "s10": 4, "s11": 1}
    assert res["days_open"] == ["wo"]


def test_oud_plan_zonder_days():
    hass = FakeHass()
    m = weekmenu.WeekmenuManager(hass)
    old = {k: v for k, v in PLAN.items() if k != "days"}
    m.import_plan(old, None)
    assert all(r["selected"] for r in m.data["plan"]["recipes"])
    res = asyncio.run(m.approve())
    assert res["total"] == 5 and res["days_open"] == []
