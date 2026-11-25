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
    mod("homeassistant.helpers.aiohttp_client", async_get_clientsession=lambda hass: hass.http_session)
    from datetime import datetime, timezone
    mod("homeassistant.util")
    mod("homeassistant.util.dt", utcnow=lambda: datetime.now(timezone.utc), now=lambda: datetime.now(),
        parse_datetime=lambda s: datetime.fromisoformat(s) if s else None)
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


def test_zoeken_bekend_en_picnic_en_toevoegen():
    hass = FakeHass()

    class Item:
        def __init__(self, i, n, p):
            self.id, self.name, self.display_price, self.unit_quantity, self.image_id = i, n, p, "500 g", "img"

    class Api:
        def search(self, q):
            return types.SimpleNamespace(items=[Item("s99", "Picnic rijstwafels naturel", 129), Item("s1", "Melk dubbel", 100)])

    entry = types.SimpleNamespace(state="loaded", entry_id="pic1", runtime_data=types.SimpleNamespace(picnic_api_client=Api()))
    hass.config_entries = types.SimpleNamespace(async_entries=lambda d: [entry])

    async def executor(fn, *a):
        return fn(*a)
    hass.async_add_executor_job = executor

    m = weekmenu.WeekmenuManager(hass)
    m.import_plan(PLAN, None)
    res = asyncio.run(m.search("melk"))
    assert res[0]["bron"] == "bekend" and res[0]["picnic_id"] == "s1"
    assert [r["picnic_id"] for r in res].count("s1") == 1  # niet dubbel
    res = asyncio.run(m.search("rijstwafels"))
    assert res[0] == {"name": "Picnic rijstwafels naturel", "picnic_id": "s99", "image_id": "img", "unit": "500 g", "unit_price": 1.29, "bron": "picnic"}

    m.add_item(res[0], 2)
    added = next(i for i in m.data["plan"]["items"] if i["picnic_id"] == "s99")
    assert added["qty"] == 2 and added["unit_price"] == 1.29
    m.add_item(res[0], 1, "standard")
    assert any(i["picnic_id"] == "s99" for i in m.data["standard_items"])


def test_zoeken_zonder_picnic():
    hass = FakeHass()
    hass.config_entries = types.SimpleNamespace(async_entries=lambda d: [])
    m = weekmenu.WeekmenuManager(hass)
    m.import_plan(PLAN, None)
    assert [r["name"] for r in asyncio.run(m.search("zal"))] == ["Zalm"]
    assert asyncio.run(m.search(" ")) == []


def test_prijscheck_en_doorvoeren():
    hass = FakeHass()

    class Item:
        def __init__(self, i, n, p, u):
            self.id, self.name, self.display_price, self.unit_quantity, self.image_id = i, n, p, u, None

    catalogus = {
        "melk": [Item("s1", "Melk", 119, "1 liter"), Item("s2", "Picnic halfvolle melk", 99, "1 liter")],
        "zalm": [Item("s11", "Zalm", 700, "250 gram"), Item("s12", "Picnic zalmfilet", 600, "250 gram")],
    }

    class Api:
        def search(self, q):
            return types.SimpleNamespace(items=next((v for k, v in catalogus.items() if k in q), []))

    entry = types.SimpleNamespace(state="loaded", entry_id="pic1", runtime_data=types.SimpleNamespace(picnic_api_client=Api()))
    hass.config_entries = types.SimpleNamespace(async_entries=lambda d: [entry])

    async def executor(fn, *a):
        return fn(*a)
    hass.async_add_executor_job = executor

    m = weekmenu.WeekmenuManager(hass)
    m.import_plan(PLAN, None)
    m.choose_day("ma", "r1")
    res = asyncio.run(m.price_check())
    sugg = {s["key"]: s for s in res["suggestions"]}
    assert set(sugg) == {"p-s1", "p-s11"}
    assert sugg["p-s1"]["alt"]["saving"] == 0.4 and sugg["p-s11"]["alt"]["picnic_id"] == "s12"
    # alleen de melk doorvoeren (zelf aangevinkt)
    out = m.apply_prices([{"key": "p-s1", "alt": sugg["p-s1"]["alt"]}])
    assert out == {"applied": 1, "saving": 0.4}
    rows = {i["key"]: i for i in m.snapshot()["view"]["items"]}
    assert rows["p-s1"]["picnic_id"] == "s2" and rows["p-s11"]["picnic_id"] == "s11"
    # receptregel via swap
    m.apply_prices([{"key": "p-s11", "alt": sugg["p-s11"]["alt"]}])
    rows = {i["key"]: i for i in m.snapshot()["view"]["items"]}
    assert rows["p-s11"]["picnic_id"] == "s12" and rows["p-s11"]["unit_price"] == 6.0
    asyncio.run(m.approve())
    bought = {c["product_id"]: c["amount"] for c in hass.calls}
    assert bought["s2"] == 2 and bought["s12"] == 1 and "s1" not in bought


class _Resp:
    def __init__(self, status, data):
        self.status, self._data = status, data
    async def __aenter__(self): return self
    async def __aexit__(self, *a): return False
    async def text(self): return str(self._data)
    async def json(self, content_type=None): return self._data


class _Session:
    def __init__(self, status=200):
        self.posts, self.status = [], status
    def post(self, url, json=None, headers=None, timeout=None):
        self.posts.append((url, json, headers))
        return _Resp(self.status, {"type": "routine_fire", "claude_code_session_url": "https://claude.ai/code/session_x"})


def test_andere_gerechten_aanvragen_en_toevoegen():
    hass = FakeHass()
    hass.http_session = _Session()
    m = weekmenu.WeekmenuManager(hass)
    m.import_plan(PLAN, None)
    with pytest.raises(HAErr):  # nog niet ingesteld
        asyncio.run(m.request_recipes("di", "iets met vis"))
    assert m.snapshot()["claude_ready"] is False
    url = "https://api.anthropic.com/v1/claude_code/routines/trig_x/fire"
    m.entry = types.SimpleNamespace(options={"claude_fire_url": url, "claude_token": "tok"})
    assert m.snapshot()["claude_ready"] is True
    m.choose_day("di", "r4")
    res = asyncio.run(m.request_recipes("di", "iets met vis"))
    sent_url, body, headers = hass.http_session.posts[0]
    assert sent_url == url and headers["Authorization"] == "Bearer tok"
    assert "dag: di" in body["text"] and "wens: iets met vis" in body["text"] and "Pasta" in body["text"]
    assert res["pending"]["session_url"].endswith("session_x")
    with pytest.raises(HAErr):  # al bezig
        asyncio.run(m.request_recipes("di"))

    out = m.add_options(
        "di",
        [{"id": "x1", "title": "Pasta met zalm", "steps": ["kook", "bak"]}, {"id": "x2", "title": "Gnocchi"}],
        [{"name": "Zalm", "picnic_id": "s11", "qty": 1, "unit_price": 7.0, "recipe_id": "x1"},
         {"name": "Gnocchi", "picnic_id": "s20", "qty": 2, "unit_price": 1.5, "recipe_id": "x2"},
         {"name": "Wees", "picnic_id": "s21", "qty": 1, "unit_price": 1, "recipe_id": "zz"}],
        week="2026-W49",
    )
    assert out == {"day": "di", "added": ["r5", "r6"]}
    di = next(d for d in m.data["plan"]["days"] if d["day"] == "di")
    assert di["options"] == ["r4", "r1", "r5", "r6"] and di["choice"] == "r4" and di["pending"] is None
    keys = [i["key"] for i in m.data["plan"]["items"]]
    assert "p-s11@r5" in keys and "p-s20@r6" in keys and not any("s21" in k for k in keys)
    assert m.data["plan"]["recipes"][-2]["steps"] == [{"text": "kook"}, {"text": "bak"}]
    assert hass.events[-1] == ("weekmenu_options_added", {"day": "di", "recipes": ["Pasta met zalm", "Gnocchi"]})
    m.choose_day("di", "r5")
    rows = {i["key"]: i for i in m.snapshot()["view"]["items"]}
    assert rows["p-s11"]["qty"] == 1 and "p-s20" not in rows
    with pytest.raises(HAErr):
        m.add_options("di", [{"title": "x"}], [], week="2026-W50")


def test_andere_gerechten_token_fout():
    hass = FakeHass()
    hass.http_session = _Session(status=401)
    m = weekmenu.WeekmenuManager(hass)
    m.import_plan(PLAN, None)
    m.entry = types.SimpleNamespace(options={"claude_fire_url": "u", "claude_token": "t"})
    with pytest.raises(HAErr, match="token"):
        asyncio.run(m.request_recipes("ma"))
    assert not next(d for d in m.data["plan"]["days"] if d["day"] == "ma").get("pending")
