"""Weekmenu: weekly groceries, recipes and cooking mode for Home Assistant.

Data lives in .storage/weekmenu (included in HA backups). Claude writes a
week plan once a week through the `weekmenu.import_plan` service; everything
after that (adjusting the list, approving, filling the Picnic cart) is plain
deterministic code here and in the panel.
"""

from __future__ import annotations

import copy
import hashlib
import logging
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

import voluptuous as vol

from homeassistant.components import panel_custom, websocket_api
from homeassistant.components.frontend import async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.core import (
    HomeAssistant,
    ServiceCall,
    ServiceResponse,
    SupportsResponse,
    callback,
)
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from . import logic
from .const import (
    DOMAIN,
    PANEL_URL,
    PICNIC_DOMAIN,
    STATIC_URL,
    STORAGE_KEY,
    STORAGE_VERSION,
)

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

FRONTEND_DIR = Path(__file__).parent / "frontend"
PANEL_FILE = "weekmenu-panel.js"


def _empty_data() -> dict[str, Any]:
    return {
        "plan": None,
        "standard_items": [],
        "preferences": {},
        "feedback": [],
        "updated_at": None,
    }


def _slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "item"


def _item_key(item: dict[str, Any]) -> str:
    if item.get("picnic_id"):
        return f"p-{item['picnic_id']}"
    return f"n-{_slug(item.get('name', ''))}"


def _norm_item(raw: dict[str, Any], default_source: str = "extra") -> dict[str, Any]:
    item = {
        "name": str(raw.get("name", "")).strip(),
        "picnic_id": (str(raw["picnic_id"]).strip() if raw.get("picnic_id") else None),
        "image_id": raw.get("image_id"),
        "unit": raw.get("unit"),
        "qty": max(0, int(raw.get("qty", 1) or 0)),
        "unit_price": float(raw["unit_price"]) if raw.get("unit_price") is not None else None,
        "promo": raw.get("promo"),
        "source": raw.get("source") or default_source,
        "recipe": raw.get("recipe"),
        "recipe_id": (str(raw["recipe_id"]) if raw.get("recipe_id") else None),
        "note": raw.get("note"),
        "question": raw.get("question"),
        "removed": bool(raw.get("removed", False)),
    }
    key = raw.get("key") or _item_key(item)
    # recipe ingredients stay separate per recipe, so they can follow the day choice
    if item["source"] == "recipe" and item["recipe_id"] and "@" not in key:
        key = f"{key}@{item['recipe_id']}"
    item["key"] = key
    return item


def _norm_items(raw_items: list[dict[str, Any]], default_source: str) -> list[dict[str, Any]]:
    """Normalize and de-duplicate (same product -> quantities added)."""
    out: dict[str, dict[str, Any]] = {}
    for raw in raw_items or []:
        item = _norm_item(raw, default_source)
        if not item["name"]:
            continue
        if item["key"] in out:
            out[item["key"]]["qty"] += item["qty"]
        else:
            out[item["key"]] = item
    return list(out.values())


TEXT_ITEM_RE = re.compile(r"^\s*(\d+)\s*[x×]?\s+(.+?)\s*$", re.IGNORECASE)


def _parse_text_items(text: str) -> list[dict[str, Any]]:
    items = []
    for part in re.split(r"[,\n;]+", text or ""):
        part = part.strip()
        if not part:
            continue
        m = TEXT_ITEM_RE.match(part)
        qty, name = (int(m.group(1)), m.group(2)) if m else (1, part)
        items.append({"name": name[:1].upper() + name[1:], "qty": qty, "source": "extra"})
    return items


class WeekmenuManager:
    """Holds the data, persists it and notifies subscribers."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.store: Store = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.data: dict[str, Any] = _empty_data()
        self._listeners: list[Callable[[], None]] = []

    async def async_load(self) -> None:
        stored = await self.store.async_load()
        if stored:
            self.data = {**_empty_data(), **stored}

    @callback
    def add_listener(self, cb: Callable[[], None]) -> Callable[[], None]:
        self._listeners.append(cb)

        def remove() -> None:
            if cb in self._listeners:
                self._listeners.remove(cb)

        return remove

    @callback
    def changed(self) -> None:
        self.data["updated_at"] = dt_util.utcnow().isoformat()
        self.store.async_delay_save(lambda: self.data, 1)
        for cb in list(self._listeners):
            try:
                cb()
            except Exception:  # noqa: BLE001
                _LOGGER.exception("Weekmenu listener failed")

    # ---- plan -----------------------------------------------------------
    def _plan(self) -> dict[str, Any]:
        plan = self.data.get("plan")
        if not plan:
            raise HomeAssistantError("Er is nog geen weekvoorstel.")
        return plan

    def _find(self, key: str) -> dict[str, Any]:
        for item in self._plan()["items"]:
            if item["key"] == key:
                return item
        raise HomeAssistantError(f"Onbekend product: {key}")

    @callback
    def import_plan(self, plan: dict[str, Any], standard_items: list | None) -> None:
        plan = copy.deepcopy(plan)
        recipes = []
        for i, r in enumerate(plan.get("recipes") or []):
            r = dict(r)
            r.setdefault("id", f"r{i + 1}")
            r.setdefault("selected", True)
            r["steps"] = [
                s if isinstance(s, dict) else {"text": str(s)} for s in r.get("steps") or []
            ]
            recipes.append(r)
        michelle = plan.get("michelle")
        if michelle:
            michelle = dict(michelle)
            michelle.setdefault("choice", None)
            for j, opt in enumerate(michelle.get("options") or []):
                opt.setdefault("id", f"m{j + 1}")
                opt["items"] = _norm_items(opt.get("items") or [], "michelle")
        questions = []
        for k, q in enumerate(plan.get("questions") or []):
            q = dict(q)
            q.setdefault("id", f"q{k + 1}")
            q.setdefault("title", q["id"])
            q["choice"] = None
            q["custom"] = None
            for j, opt in enumerate(q.get("options") or []):
                opt.setdefault("id", f"o{j + 1}")
                opt["items"] = _norm_items(opt.get("items") or [], "snack")
            questions.append(q)
        days = logic.norm_days(plan.get("days"), {r["id"] for r in recipes})
        if days:
            for r in recipes:
                r["selected"] = False
        self.data["plan"] = {
            "week": plan.get("week"),
            "delivery": plan.get("delivery"),
            "order_deadline": plan.get("order_deadline"),
            "advice": plan.get("advice"),
            "generated_at": dt_util.utcnow().isoformat(),
            "status": "proposed",
            "recipes": recipes,
            "days": days,
            "items": _norm_items(plan.get("items") or [], "standard"),
            "michelle": michelle,
            "questions": questions,
            "approved_at": None,
            "results": [],
        }
        if standard_items is not None:
            self.data["standard_items"] = _norm_items(standard_items, "standard")
        logic.sync_selected(self.data["plan"])
        self.changed()
        self.hass.bus.async_fire(
            f"{DOMAIN}_plan_imported",
            {
                "week": plan.get("week"),
                "recipes": [r.get("title") for r in recipes],
                "days": [
                    {"day": d["day"], "date": d.get("date"), "options": len(d["options"]), "choice": d["choice"]}
                    for d in days or []
                ],
                "michelle": (
                    {
                        "day_label": michelle.get("day_label"),
                        "question": michelle.get("question"),
                        "options": [
                            {"id": o["id"], "title": o.get("title"), "emoji": o.get("emoji")}
                            for o in michelle.get("options") or []
                        ],
                    }
                    if michelle
                    else None
                ),
                "questions": [
                    {
                        "id": q["id"],
                        "who": q.get("who"),
                        "title": q.get("title"),
                        "question": q.get("question"),
                        "options": [
                            {"id": o["id"], "title": o.get("title"), "emoji": o.get("emoji")}
                            for o in q.get("options") or []
                        ],
                    }
                    for q in questions
                ],
            },
        )

    @callback
    def set_qty(self, key: str, qty: int) -> None:
        plan = self._plan()
        exact = next((i for i in plan["items"] if i["key"] == key), None)
        if exact is None:  # merged recipe row (same product in several chosen recipes)
            try:
                logic.set_qty(plan, key, qty)
            except logic.PlanError as err:
                raise HomeAssistantError(str(err)) from err
            self.changed()
            return
        item = exact
        if int(qty) <= 0 and not item["removed"] and item.get("source") == "advice":
            self.restock(item, "skipped")
        item["qty"] = max(0, int(qty))
        item["removed"] = item["qty"] == 0
        self.changed()

    @callback
    def set_removed(self, key: str, removed: bool) -> None:
        plan = self._plan()
        exact = next((i for i in plan["items"] if i["key"] == key), None)
        if exact is None:
            try:
                logic.set_removed(plan, key, removed)
            except logic.PlanError as err:
                raise HomeAssistantError(str(err)) from err
            self.changed()
            return
        item = exact
        if removed and not item["removed"] and item.get("source") == "advice":
            self.restock(item, "skipped")
        item["removed"] = removed
        if not removed and item["qty"] == 0:
            item["qty"] = 1
        self.changed()

    @callback
    def choose_day(self, day: str, choice: str | None) -> dict[str, Any]:
        plan = self._plan()
        try:
            res = logic.choose_day(plan, day, choice)
        except logic.PlanError as err:
            raise HomeAssistantError(str(err)) from err
        self.changed()
        recipe = next((r for r in plan.get("recipes") or [] if r.get("id") == res["choice"]), None)
        self.hass.bus.async_fire(
            f"{DOMAIN}_day_chosen",
            {**res, "title": recipe.get("title") if recipe else None, "summary": logic.summary(plan)},
        )
        return res

    # ---- zoeken (voorstellen bij het typen) ------------------------------
    def _known_products(self) -> list[dict[str, Any]]:
        """Producten die we al kennen: vaste lijst, dit plan, vraag-opties, geleerd, bijvullen."""
        d = self.data
        plan = d.get("plan") or {}
        out: list[dict[str, Any]] = []
        out += d.get("standard_items") or []
        out += plan.get("items") or []
        for q in plan.get("questions") or []:
            for o in q.get("options") or []:
                out += o.get("items") or []
        for o in (plan.get("michelle") or {}).get("options") or []:
            out += o.get("items") or []
        prefs = d.get("preferences") or {}
        for entries in (prefs.get("learned") or {}).values():
            for e in entries:
                out += e.get("items") or []
        out += [{"name": b.get("name"), "picnic_id": b.get("picnic_id")} for b in prefs.get("bijvullen") or []]
        return [p for p in out if p.get("name")]

    async def search(self, query: str, limit: int = 10) -> list[dict[str, Any]]:
        words = [w for w in _slug(query).split("-") if w]
        if not words:
            return []
        seen: set[str] = set()
        results: list[dict[str, Any]] = []

        def add(p: dict[str, Any], bron: str) -> None:
            key = p.get("picnic_id") or _slug(p.get("name", ""))
            if not key or key in seen:
                return
            seen.add(key)
            results.append(
                {
                    "name": p.get("name"),
                    "picnic_id": p.get("picnic_id"),
                    "image_id": p.get("image_id"),
                    "unit": p.get("unit"),
                    "unit_price": p.get("unit_price"),
                    "bron": bron,
                }
            )

        for p in self._known_products():
            if all(w in _slug(p["name"]) for w in words):
                add(p, "bekend")
        for p in await self._picnic_search(query):
            add(p, "picnic")
        return results[:limit]

    async def _picnic_search(self, query: str) -> list[dict[str, Any]]:
        entries = [
            e for e in self.hass.config_entries.async_entries(PICNIC_DOMAIN) if e.state is ConfigEntryState.LOADED
        ]
        api = getattr(getattr(entries[0], "runtime_data", None), "picnic_api_client", None) if entries else None
        if api is None:
            return []
        try:
            res = await self.hass.async_add_executor_job(api.search, query)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Picnic zoeken mislukt: %s", err)
            return []
        items = getattr(res, "items", None)
        if items is None and isinstance(res, list):  # oudere api: [{items: [...]}]
            items = [i for blok in res for i in (blok.get("items") or []) if isinstance(i, dict)]
        out = []
        for it in (items or [])[:12]:
            g = (lambda k: it.get(k)) if isinstance(it, dict) else (lambda k: getattr(it, k, None))
            price = g("display_price") or g("price")
            if not g("name"):
                continue
            out.append(
                {
                    "name": g("name"),
                    "picnic_id": str(g("id")) if g("id") else None,
                    "image_id": g("image_id"),
                    "unit": g("unit_quantity"),
                    "unit_price": round(price / 100, 2) if isinstance(price, (int, float)) else None,
                }
            )
        return out

    @callback
    def add_item(self, raw: dict[str, Any], qty: int = 1, target: str = "week") -> None:
        item = {**raw, "qty": max(1, int(qty))}
        if target == "standard":
            self.standard_add([item])
        else:
            self.add_items([item])

    @callback
    def answer_item(self, qid: str, raw: dict[str, Any]) -> None:
        q = self._question(qid)
        self._clear_answer(qid)
        q["choice"] = "custom"
        q["custom"] = raw.get("name")
        it = _norm_item({**raw, "qty": raw.get("qty") or 1}, "snack")
        self._plan()["items"].append({**it, "source": "snack", "question": qid, "recipe": q.get("title")})
        self.learn(qid, raw.get("name", ""), [it])
        self.changed()
        self.hass.bus.async_fire(
            f"{DOMAIN}_answer",
            {"question_id": qid, "who": q.get("who"), "option_id": "custom", "title": raw.get("name")},
        )

    def snapshot(self) -> dict[str, Any]:
        """Stored data plus a computed view (items that count, day summary) for the panel."""
        return {**self.data, "view": logic.view(self.data.get("plan"))}

    @callback
    def add_items(self, raw_items: list[dict[str, Any]]) -> None:
        plan = self._plan()
        for new in _norm_items(raw_items, "extra"):
            self.restock(new, "added")
            existing = next((i for i in plan["items"] if i["key"] == new["key"]), None)
            if existing:
                existing["qty"] = (existing["qty"] if not existing["removed"] else 0) + new["qty"]
                existing["removed"] = False
            else:
                plan["items"].append(new)
        self.changed()

    @callback
    def michelle_choose(self, option_id: str | None) -> None:
        plan = self._plan()
        m = plan.get("michelle")
        if not m:
            raise HomeAssistantError("Er is deze week geen keuze voor Michelle.")
        # remove previous choice's items
        plan["items"] = [i for i in plan["items"] if i.get("source") != "michelle"]
        opt = None
        if option_id:
            opt = next((o for o in m.get("options") or [] if o["id"] == option_id), None)
            if opt is None:
                raise HomeAssistantError(f"Onbekende optie: {option_id}")
        m["choice"] = option_id
        if opt:
            for it in opt["items"]:
                plan["items"].append({**copy.deepcopy(it), "source": "michelle"})
            self.learn("michelle_dinsdag", opt.get("title", ""), opt["items"])
        self.changed()
        self.hass.bus.async_fire(
            f"{DOMAIN}_michelle_choice",
            {
                "option_id": option_id,
                "title": opt.get("title") if opt else None,
                # short text for the morning reminder, e.g. "maaltijdsalade"
                "reminder": (opt.get("reminder") or opt.get("title", "").lower()) if opt else "",
            },
        )

    # ---- restock log (household items: what was skipped / added / bought) ----
    @callback
    def restock(self, item: dict[str, Any], action: str) -> None:
        log = self.data.setdefault("preferences", {}).setdefault("restock_log", [])
        log.append(
            {
                "name": item.get("name"),
                "picnic_id": item.get("picnic_id"),
                "action": action,  # skipped | added | bought
                "date": dt_util.now().date().isoformat(),
            }
        )
        self.data["preferences"]["restock_log"] = log[-300:]

    # ---- weekly questions (snacks etc.) + learning -------------------------
    @callback
    def learn(self, key: str, title: str, items: list | None = None) -> None:
        """Remember what was picked/typed so Claude offers it first next time."""
        if not title:
            return
        learned = self.data.setdefault("preferences", {}).setdefault("learned", {})
        entries = learned.setdefault(key, [])
        entry = next((e for e in entries if e["title"].lower() == title.lower()), None)
        if entry is None:
            entry = {"title": title, "count": 0}
            entries.append(entry)
        entry["count"] += 1
        entry["last"] = dt_util.now().date().isoformat()
        if items:
            entry["items"] = [
                {k: i.get(k) for k in ("name", "picnic_id", "image_id", "unit_price") if i.get(k)}
                for i in items
            ]
        entries.sort(key=lambda e: (e["count"], e.get("last", "")), reverse=True)
        learned[key] = entries[:12]

    def _question(self, qid: str) -> dict[str, Any]:
        q = next((q for q in self._plan().get("questions") or [] if q["id"] == qid), None)
        if q is None:
            raise HomeAssistantError(f"Onbekende vraag: {qid}")
        return q

    def _clear_answer(self, qid: str) -> None:
        plan = self._plan()
        plan["items"] = [i for i in plan["items"] if i.get("question") != qid]

    @callback
    def answer(self, qid: str, option_id: str | None) -> None:
        q = self._question(qid)
        self._clear_answer(qid)
        q["custom"] = None
        q["choice"] = option_id
        opt = None
        if option_id:
            opt = next((o for o in q.get("options") or [] if o["id"] == option_id), None)
            if opt is None:
                raise HomeAssistantError(f"Onbekende optie: {option_id}")
            for it in opt["items"]:
                self._plan()["items"].append(
                    {**copy.deepcopy(it), "source": "snack", "question": qid, "recipe": q.get("title")}
                )
            self.learn(qid, opt.get("title", ""), opt["items"])
        self.changed()
        self.hass.bus.async_fire(
            f"{DOMAIN}_answer",
            {"question_id": qid, "who": q.get("who"), "option_id": option_id, "title": opt.get("title") if opt else None},
        )

    @callback
    def answer_text(self, qid: str, text: str) -> None:
        q = self._question(qid)
        text = (text or "").strip()
        if not text:
            return self.answer(qid, None)
        self._clear_answer(qid)
        q["choice"] = "custom"
        q["custom"] = text
        for it in _norm_items(_parse_text_items(text), "snack"):
            self._plan()["items"].append({**it, "source": "snack", "question": qid, "recipe": q.get("title")})
        self.learn(qid, text)
        self.changed()
        self.hass.bus.async_fire(
            f"{DOMAIN}_answer",
            {"question_id": qid, "who": q.get("who"), "option_id": "custom", "title": text},
        )

    # ---- standard list ---------------------------------------------------
    @callback
    def standard_add(self, raw_items: list[dict[str, Any]]) -> None:
        std = self.data["standard_items"]
        for new in _norm_items(raw_items, "standard"):
            new["source"] = "standard"
            existing = next((i for i in std if i["key"] == new["key"]), None)
            if existing:
                existing["qty"] = new["qty"]
                existing["removed"] = False
            else:
                std.append(new)
        self.changed()

    @callback
    def standard_set(self, key: str, qty: int) -> None:
        std = self.data["standard_items"]
        if qty <= 0:
            self.data["standard_items"] = [i for i in std if i["key"] != key]
        else:
            for i in std:
                if i["key"] == key:
                    i["qty"] = int(qty)
        self.changed()

    # ---- recipes ------------------------------------------------------------
    @callback
    def recipe_feedback(self, recipe_id: str, rating: int, by: str | None, note: str | None) -> None:
        plan = self.data.get("plan") or {}
        recipe = next((r for r in plan.get("recipes") or [] if r.get("id") == recipe_id), None)
        self.data["feedback"].append(
            {
                "recipe_id": recipe_id,
                "title": recipe.get("title") if recipe else None,
                "date": dt_util.now().date().isoformat(),
                "by": by,
                "rating": 1 if rating > 0 else -1,
                "note": note,
            }
        )
        self.data["feedback"] = self.data["feedback"][-200:]
        if recipe is not None:
            recipe["rating"] = 1 if rating > 0 else -1
        self.changed()

    # ---- approve --------------------------------------------------------
    async def approve(self) -> dict[str, Any]:
        plan = self._plan()
        entries = [
            e
            for e in self.hass.config_entries.async_entries(PICNIC_DOMAIN)
            if e.state is ConfigEntryState.LOADED
        ]
        if not entries:
            raise HomeAssistantError("De Picnic-koppeling is niet actief.")
        entry_id = entries[0].entry_id
        # Only items that count: recipe ingredients of chosen recipes (merged per product).
        # A day without a choice counts as "niets koken".
        todo = [i for i in logic.effective_items(plan) if not i.get("removed") and i.get("qty", 0) > 0]
        open_days = logic.summary(plan)["days_open"] if plan.get("days") else []
        results = []
        for item in todo:
            data: dict[str, Any] = {"config_entry_id": entry_id, "amount": min(item["qty"], 50)}
            if item.get("picnic_id"):
                data["product_id"] = item["picnic_id"]
            else:
                data["product_name"] = item["name"]
            try:
                await self.hass.services.async_call(PICNIC_DOMAIN, "add_product", data, blocking=True)
                results.append({"key": item["key"], "ok": True})
            except Exception as err:  # noqa: BLE001
                _LOGGER.warning("Picnic add_product mislukt voor %s: %s", item["name"], err)
                results.append({"key": item["key"], "ok": False, "error": str(err)})
        for item, res in zip(todo, results):
            if res["ok"] and item.get("source") in ("advice", "extra"):
                self.restock(item, "bought")
        ok = sum(1 for r in results if r["ok"])
        plan["status"] = "approved"
        plan["approved_at"] = dt_util.utcnow().isoformat()
        plan["results"] = results
        self.changed()
        summary = {"added": ok, "failed": len(results) - ok, "total": len(results), "days_open": open_days}
        self.hass.bus.async_fire(f"{DOMAIN}_approved", summary)
        return summary

    @callback
    def reopen(self) -> None:
        plan = self._plan()
        plan["status"] = "proposed"
        self.changed()


# --------------------------------------------------------------------------
# Websocket API (works for non-admin users, e.g. Michelle)
# --------------------------------------------------------------------------


def _mgr(hass: HomeAssistant) -> WeekmenuManager:
    mgr = hass.data.get(DOMAIN)
    if mgr is None:
        raise HomeAssistantError("Weekmenu is niet geladen.")
    return mgr


def _run(connection, msg, fn: Callable[[], Any]) -> None:
    try:
        fn()
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "weekmenu_error", str(err))
        return
    connection.send_result(msg["id"])


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/subscribe"})
@callback
def ws_subscribe(hass, connection, msg):
    mgr = _mgr(hass)

    @callback
    def forward() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], mgr.snapshot()))

    connection.subscriptions[msg["id"]] = mgr.add_listener(forward)
    connection.send_result(msg["id"])
    forward()


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/item_qty", vol.Required("key"): str, vol.Required("qty"): int}
)
@callback
def ws_item_qty(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).set_qty(msg["key"], msg["qty"]))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/item_removed", vol.Required("key"): str, vol.Required("removed"): bool}
)
@callback
def ws_item_removed(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).set_removed(msg["key"], msg["removed"]))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/add_text", vol.Required("text"): str}
)
@callback
def ws_add_text(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).add_items(_parse_text_items(msg["text"])))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/standard_add", vol.Required("text"): str}
)
@callback
def ws_standard_add(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).standard_add(_parse_text_items(msg["text"])))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/standard_qty", vol.Required("key"): str, vol.Required("qty"): int}
)
@callback
def ws_standard_qty(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).standard_set(msg["key"], msg["qty"]))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/michelle_choose", vol.Optional("option_id"): vol.Any(str, None)}
)
@callback
def ws_michelle_choose(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).michelle_choose(msg.get("option_id")))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/answer", vol.Required("question_id"): str, vol.Optional("option_id"): vol.Any(str, None)}
)
@callback
def ws_answer(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).answer(msg["question_id"], msg.get("option_id")))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/answer_text", vol.Required("question_id"): str, vol.Required("text"): str}
)
@callback
def ws_answer_text(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).answer_text(msg["question_id"], msg["text"]))


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
    user = connection.user.name if connection.user else None
    _run(
        connection,
        msg,
        lambda: _mgr(hass).recipe_feedback(msg["recipe_id"], msg["rating"], user, msg.get("note")),
    )


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/choose_day", vol.Required("day"): str, vol.Optional("choice"): vol.Any(str, None)}
)
@callback
def ws_choose_day(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).choose_day(msg["day"], msg.get("choice")))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/search", vol.Required("query"): str}
)
@websocket_api.async_response
async def ws_search(hass, connection, msg):
    connection.send_result(msg["id"], {"query": msg["query"], "results": await _mgr(hass).search(msg["query"])})


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


@websocket_api.websocket_command(
    {
        vol.Required("type"): "weekmenu/add_item",
        vol.Required("item"): ITEM_SCHEMA,
        vol.Optional("qty", default=1): int,
        vol.Optional("target", default="week"): vol.In(["week", "standard"]),
    }
)
@callback
def ws_add_item(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).add_item(msg["item"], msg["qty"], msg["target"]))


@websocket_api.websocket_command(
    {vol.Required("type"): "weekmenu/answer_item", vol.Required("question_id"): str, vol.Required("item"): ITEM_SCHEMA}
)
@callback
def ws_answer_item(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).answer_item(msg["question_id"], msg["item"]))


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/approve"})
@websocket_api.async_response
async def ws_approve(hass, connection, msg):
    try:
        result = await _mgr(hass).approve()
    except HomeAssistantError as err:
        connection.send_error(msg["id"], "weekmenu_error", str(err))
        return
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): "weekmenu/reopen"})
@callback
def ws_reopen(hass, connection, msg):
    _run(connection, msg, lambda: _mgr(hass).reopen())


WS_COMMANDS = (
    ws_subscribe,
    ws_item_qty,
    ws_item_removed,
    ws_add_text,
    ws_standard_add,
    ws_standard_qty,
    ws_michelle_choose,
    ws_answer,
    ws_answer_text,
    ws_feedback,
    ws_choose_day,
    ws_search,
    ws_add_item,
    ws_answer_item,
    ws_approve,
    ws_reopen,
)

# --------------------------------------------------------------------------
# Services (for Claude, automations and actionable notifications)
# --------------------------------------------------------------------------

IMPORT_SCHEMA = vol.Schema(
    {
        vol.Required("plan"): dict,
        vol.Optional("standard_items"): list,
    }
)


def _register_services(hass: HomeAssistant) -> None:
    async def import_plan(call: ServiceCall) -> None:
        _mgr(hass).import_plan(call.data["plan"], call.data.get("standard_items"))

    async def get_context(call: ServiceCall) -> ServiceResponse:
        return copy.deepcopy(_mgr(hass).snapshot())

    async def choose_day(call: ServiceCall) -> ServiceResponse:
        return _mgr(hass).choose_day(call.data["day"], call.data.get("choice"))

    async def approve(call: ServiceCall) -> ServiceResponse:
        return await _mgr(hass).approve()

    async def add_text(call: ServiceCall) -> None:
        _mgr(hass).add_items(_parse_text_items(call.data["text"]))

    async def michelle_choose(call: ServiceCall) -> None:
        _mgr(hass).michelle_choose(call.data.get("option_id"))

    async def answer(call: ServiceCall) -> None:
        if call.data.get("text"):
            _mgr(hass).answer_text(call.data["question_id"], call.data["text"])
        else:
            _mgr(hass).answer(call.data["question_id"], call.data.get("option_id"))

    async def set_preferences(call: ServiceCall) -> None:
        mgr = _mgr(hass)
        mgr.data["preferences"] = {**mgr.data.get("preferences", {}), **call.data["preferences"]}
        mgr.changed()

    hass.services.async_register(DOMAIN, "import_plan", import_plan, schema=IMPORT_SCHEMA)
    hass.services.async_register(
        DOMAIN, "get_context", get_context, supports_response=SupportsResponse.ONLY
    )
    hass.services.async_register(
        DOMAIN, "approve", approve, supports_response=SupportsResponse.OPTIONAL
    )
    hass.services.async_register(
        DOMAIN,
        "choose_day",
        choose_day,
        schema=vol.Schema(
            {vol.Required("day"): cv.string, vol.Optional("choice"): vol.Any(cv.string, None)}
        ),
        supports_response=SupportsResponse.OPTIONAL,
    )
    hass.services.async_register(
        DOMAIN, "add_text", add_text, schema=vol.Schema({vol.Required("text"): cv.string})
    )
    hass.services.async_register(
        DOMAIN,
        "michelle_choose",
        michelle_choose,
        schema=vol.Schema({vol.Optional("option_id"): vol.Any(cv.string, None)}),
    )
    hass.services.async_register(
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
    hass.services.async_register(
        DOMAIN,
        "set_preferences",
        set_preferences,
        schema=vol.Schema({vol.Required("preferences"): dict}),
    )


# --------------------------------------------------------------------------
# Setup
# --------------------------------------------------------------------------


def _file_hash(path: Path) -> str:
    try:
        return hashlib.sha1(path.read_bytes()).hexdigest()[:10]
    except OSError:
        return datetime.now().strftime("%Y%m%d%H%M")


async def async_setup(hass: HomeAssistant, config) -> bool:
    for cmd in WS_COMMANDS:
        websocket_api.async_register_command(hass, cmd)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    mgr = WeekmenuManager(hass)
    await mgr.async_load()
    hass.data[DOMAIN] = mgr

    if not hass.data.get(f"{DOMAIN}_static"):
        await hass.http.async_register_static_paths(
            [StaticPathConfig(STATIC_URL, str(FRONTEND_DIR), False)]
        )
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
    _register_services(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    async_remove_panel(hass, PANEL_URL)
    for service in hass.services.async_services_for_domain(DOMAIN):
        hass.services.async_remove(DOMAIN, service)
    mgr: WeekmenuManager | None = hass.data.pop(DOMAIN, None)
    if mgr is not None:
        await mgr.store.async_save(mgr.data)
    return True
