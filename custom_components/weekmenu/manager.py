"""WeekmenuManager: holds the data, persists it and notifies listeners (panel, sensors)."""

from __future__ import annotations

import asyncio
import copy
import logging
import re
import unicodedata
import uuid
from datetime import timedelta
from typing import Any, Callable

from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.event import async_track_point_in_utc_time
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from . import logic, prices, schema
from .const import (
    CONF_FIRE_URL,
    CONF_TOKEN,
    DOMAIN,
    PENDING_MINUTES,
    PICNIC_DOMAIN,
    STATUS_APPROVED,
    STATUS_APPROVING,
    STATUS_PROPOSED,
    STORAGE_KEY,
    STORAGE_MINOR_VERSION,
    STORAGE_VERSION,
    TIMER_KEEP_SECONDS,
)

_LOGGER = logging.getLogger(__name__)


def _empty_data() -> dict[str, Any]:
    return {
        "plan": None,
        "standard_items": [],
        "preferences": {},
        "feedback": [],
        "timers": [],
        "updated_at": None,
    }


class WeekmenuStore(Store):
    """Store with migrations; older data simply gets the new keys."""

    async def _async_migrate_func(self, old_major_version, old_minor_version, old_data):
        data = {**_empty_data(), **(old_data or {})}
        plan = data.get("plan")
        if plan and "sent" not in plan:
            # plans approved before 0.9: we don't know what went to Picnic; assume all of it
            plan["sent"] = (
                {pk: {"qty": w["qty"], "name": w["name"]} for pk, w in logic.wanted(plan).items()}
                if plan.get("status") == STATUS_APPROVED
                else {}
            )
        return data


def _slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text)).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "item"


def _item_key(item: dict[str, Any]) -> str:
    if item.get("picnic_id"):
        return f"p-{item['picnic_id']}"
    return f"n-{_slug(item.get('name', ''))}"


def norm_item(raw: dict[str, Any], default_source: str = "extra") -> dict[str, Any]:
    item = {
        "name": str(raw.get("name", "")).strip(),
        "picnic_id": (str(raw["picnic_id"]).strip() if raw.get("picnic_id") else None),
        "image_id": raw.get("image_id"),
        "unit": raw.get("unit"),
        "qty": max(0, int(raw.get("qty", 1) if raw.get("qty") is not None else 1)),
        "unit_price": float(raw["unit_price"]) if raw.get("unit_price") is not None else None,
        "promo": raw.get("promo"),
        "source": raw.get("source") or default_source,
        "recipe": raw.get("recipe"),
        "recipe_id": (str(raw["recipe_id"]) if raw.get("recipe_id") else None),
        "note": raw.get("note"),
        "question": raw.get("question"),
        "removed": bool(raw.get("removed", False)),
    }
    bulk = logic.norm_bulk(raw.get("bulk"))
    if bulk:
        item["bulk"] = bulk
    key = raw.get("key") or _item_key(item)
    # recipe ingredients stay separate per recipe, so they can follow the day choice
    if item["source"] == "recipe" and item["recipe_id"] and "@" not in key:
        key = f"{key}@{item['recipe_id']}"
    item["key"] = key
    return item


def norm_items(raw_items: list[dict[str, Any]], default_source: str) -> list[dict[str, Any]]:
    """Normalize and de-duplicate (same product -> quantities added)."""
    out: dict[str, dict[str, Any]] = {}
    for raw in raw_items or []:
        item = norm_item(raw, default_source)
        if not item["name"]:
            continue
        if item["key"] in out:
            out[item["key"]]["qty"] += item["qty"]
        else:
            out[item["key"]] = item
    return list(out.values())


def norm_recipe(raw: dict[str, Any], default_id: str) -> dict[str, Any]:
    r = dict(raw)
    r["id"] = str(r.get("id") or default_id)
    r.setdefault("selected", True)
    r["steps"] = [s if isinstance(s, dict) else {"text": str(s)} for s in r.get("steps") or []]
    return r


TEXT_ITEM_RE = re.compile(r"^\s*(\d+)\s*[x×]?\s+(.+?)\s*$", re.IGNORECASE)


def parse_text_items(text: str) -> list[dict[str, Any]]:
    items = []
    for part in re.split(r"[,\n;]+", text or ""):
        part = part.strip()
        if not part:
            continue
        m = TEXT_ITEM_RE.match(part)
        qty, name = (int(m.group(1)), m.group(2)) if m else (1, part)
        items.append({"name": name[:1].upper() + name[1:], "qty": min(qty, 99), "source": "extra"})
    return items


class WeekmenuManager:
    """Holds the data, persists it and notifies subscribers."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.store: Store = WeekmenuStore(hass, STORAGE_VERSION, STORAGE_KEY, minor_version=STORAGE_MINOR_VERSION)
        self.data: dict[str, Any] = _empty_data()
        self.entry: ConfigEntry | None = None
        self._listeners: list[Callable[[], None]] = []
        self._approve_lock = asyncio.Lock()
        self._timer_unsubs: dict[str, Callable[[], None]] = {}

    async def async_load(self) -> None:
        stored = await self.store.async_load()
        if stored:
            self.data = {**_empty_data(), **stored}
        plan = self.data.get("plan")
        if plan and plan.get("status") == STATUS_APPROVING:
            # HA restarted while filling the cart: whatever was sent is in plan.sent
            plan["status"] = STATUS_PROPOSED
            plan.pop("progress", None)
        self._restore_timers()

    @callback
    def async_shutdown(self) -> None:
        for unsub in self._timer_unsubs.values():
            unsub()
        self._timer_unsubs.clear()

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

    # ---- what the panel and Claude get ---------------------------------------
    def snapshot(self) -> dict[str, Any]:
        """Everything the panel needs (not the learning data, logs or feedback history)."""
        return {
            "plan": self.data.get("plan"),
            "standard_items": self.data.get("standard_items") or [],
            "timers": self.data.get("timers") or [],
            "view": logic.view(self.data.get("plan")),
            "claude_ready": bool(self._claude_link()),
            "updated_at": self.data.get("updated_at"),
        }

    def context(self) -> dict[str, Any]:
        """Full data for Claude (get_context) and diagnostics."""
        return {**copy.deepcopy(self.data), "view": logic.view(self.data.get("plan")), "claude_ready": bool(self._claude_link())}

    # ---- plan -----------------------------------------------------------
    def _plan(self) -> dict[str, Any]:
        plan = self.data.get("plan")
        if not plan:
            raise HomeAssistantError("Er is nog geen weekvoorstel.")
        return plan

    def _editable(self) -> dict[str, Any]:
        plan = self._plan()
        if plan.get("status") == STATUS_APPROVING:
            raise HomeAssistantError("Het mandje wordt nu gevuld. Even geduld.")
        return plan

    def _find(self, key: str) -> dict[str, Any]:
        for item in self._plan()["items"]:
            if item["key"] == key:
                return item
        raise HomeAssistantError(f"Onbekend product: {key}")

    @callback
    def import_plan(self, plan: dict[str, Any], standard_items: list | None) -> dict[str, Any]:
        try:
            plan = schema.validate_plan(copy.deepcopy(plan))
            if standard_items is not None:
                standard_items = schema.validate_items(standard_items, "standard_items")
        except schema.PlanInvalid as err:
            raise HomeAssistantError(str(err)) from err
        recipes = [norm_recipe(r, f"r{i + 1}") for i, r in enumerate(plan.get("recipes") or [])]
        michelle = plan.get("michelle")
        if michelle:
            michelle = dict(michelle)
            michelle.setdefault("choice", None)
            for j, opt in enumerate(michelle.get("options") or []):
                opt.setdefault("id", f"m{j + 1}")
                opt["items"] = norm_items(opt.get("items") or [], "michelle")
        questions = []
        for k, q in enumerate(plan.get("questions") or []):
            q = dict(q)
            q.setdefault("id", f"q{k + 1}")
            q.setdefault("title", q["id"])
            q["choice"] = None
            q["custom"] = None
            for j, opt in enumerate(q.get("options") or []):
                opt.setdefault("id", f"o{j + 1}")
                opt["items"] = norm_items(opt.get("items") or [], "snack")
            questions.append(q)
        days = logic.norm_days(plan.get("days"), {r["id"] for r in recipes})
        if days:
            for r in recipes:
                r["selected"] = False
        tz = dt_util.get_default_time_zone()
        week = plan.get("week")
        delivery_at = schema.parse_when(plan.get("delivery_at") or plan.get("delivery"), week, tz)
        deadline_at = schema.parse_when(plan.get("order_deadline_at") or plan.get("order_deadline"), week, tz)
        self.data["plan"] = {
            "week": week,
            "delivery": plan.get("delivery"),
            "order_deadline": plan.get("order_deadline"),
            "delivery_at": schema.iso_or_none(delivery_at),
            "order_deadline_at": schema.iso_or_none(deadline_at),
            "advice": plan.get("advice"),
            "generated_at": dt_util.utcnow().isoformat(),
            "status": STATUS_PROPOSED,
            "recipes": recipes,
            "days": days,
            "items": norm_items(plan.get("items") or [], "standard"),
            "michelle": michelle,
            "questions": questions,
            "approved_at": None,
            "results": [],
            "sent": {},
        }
        if standard_items is not None:
            self.data["standard_items"] = norm_items(standard_items, "standard")
        logic.sync_selected(self.data["plan"])
        self.changed()
        self.hass.bus.async_fire(
            f"{DOMAIN}_plan_imported",
            {
                "week": week,
                "recipes": [r.get("title") for r in recipes],
                "delivery_at": self.data["plan"]["delivery_at"],
                "order_deadline_at": self.data["plan"]["order_deadline_at"],
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
        return {
            "week": week,
            "recipes": len(recipes),
            "items": len(self.data["plan"]["items"]),
            "delivery_at": self.data["plan"]["delivery_at"],
            "order_deadline_at": self.data["plan"]["order_deadline_at"],
        }

    @callback
    def set_qty(self, key: str, qty: int) -> None:
        plan = self._editable()
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
        item["qty"] = max(0, min(99, int(qty)))
        item["removed"] = item["qty"] == 0
        self.changed()

    @callback
    def set_removed(self, key: str, removed: bool) -> None:
        plan = self._editable()
        exact = next((i for i in plan["items"] if i["key"] == key), None)
        if exact is None:
            try:
                logic.set_removed(plan, key, removed)
            except logic.PlanError as err:
                raise HomeAssistantError(str(err)) from err
            self.changed()
            return
        item = exact
        if item.get("source") == "advice":
            if removed and not item["removed"]:
                self.restock(item, "skipped")
            elif not removed and item["removed"]:
                self.unrestock(item, "skipped")  # undo: they did need it after all
        item["removed"] = removed
        if not removed and item["qty"] == 0:
            item["qty"] = 1
        self.changed()

    @callback
    def link_item(self, key: str, raw: dict[str, Any]) -> None:
        """Couple a list row (typed by name) to a real Picnic product."""
        plan = self._editable()
        if not raw.get("picnic_id"):
            raise HomeAssistantError("Kies een product uit de zoekresultaten.")
        fields = {
            "name": str(raw.get("name") or "").strip(),
            "picnic_id": str(raw["picnic_id"]),
            "image_id": raw.get("image_id"),
            "unit": raw.get("unit"),
            "unit_price": float(raw["unit_price"]) if raw.get("unit_price") is not None else None,
        }
        members = logic.members(plan, key)
        if not members:
            raise HomeAssistantError(f"Onbekend product: {key}")
        for m in members:
            m.update({k: v for k, v in fields.items() if v is not None or k != "name"})
        self.changed()

    @callback
    def choose_day(self, day: str, choice: str | None) -> dict[str, Any]:
        plan = self._editable()
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

        # known products first, but only those that are linked to Picnic
        for p in self._known_products():
            if p.get("picnic_id") and all(w in _slug(p["name"]) for w in words):
                add(p, "bekend")
        for p in await self._picnic_search(query):
            add(p, "picnic")
        return results[:limit]

    def _picnic_entry(self) -> ConfigEntry | None:
        entries = [
            e for e in self.hass.config_entries.async_entries(PICNIC_DOMAIN) if e.state is ConfigEntryState.LOADED
        ]
        return entries[0] if entries else None

    def _picnic_api(self):
        # The core Picnic integration has no search action; use its API client (best effort).
        entry = self._picnic_entry()
        return getattr(getattr(entry, "runtime_data", None), "picnic_api_client", None) if entry else None

    async def _picnic_search(self, query: str, limit: int = 12) -> list[dict[str, Any]]:
        api = self._picnic_api()
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
        for it in (items or [])[:limit]:
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

    # ---- new recipes via Claude ----------------------------------------------
    def _claude_link(self) -> tuple[str, str] | None:
        opts = self.entry.options if self.entry else {}
        url, token = opts.get(CONF_FIRE_URL), opts.get(CONF_TOKEN)
        return (url, token) if url and token else None

    def _day(self, plan: dict[str, Any], day: str) -> dict[str, Any]:
        dk = str(day).strip().lower()[:2]
        d = next((x for x in plan.get("days") or [] if x["day"] == dk), None)
        if d is None:
            raise HomeAssistantError(f"Onbekende dag: {day}")
        return d

    async def request_recipes(self, day: str, wish: str | None = None) -> dict[str, Any]:
        """Ask the Claude task for new options for one day (button 'Andere gerechten')."""
        plan = self._editable()
        if plan.get("status") == STATUS_APPROVED:
            raise HomeAssistantError("Deze week staat al in je mandje. Tik eerst op Aanpassen.")
        d = self._day(plan, day)
        link = self._claude_link()
        if not link:
            raise HomeAssistantError(
                "Stel eerst de Claude-koppeling in: Instellingen → Apparaten & diensten → Weekmenu → Configureren."
            )
        pending = d.get("pending")
        if pending:
            started = dt_util.parse_datetime(pending.get("at") or "")
            if started and (dt_util.utcnow() - started).total_seconds() < PENDING_MINUTES * 60:
                raise HomeAssistantError("Claude zoekt al nieuwe gerechten voor deze dag.")
        wish = (wish or "").strip()[:200]
        titles = {r.get("id"): r.get("title") for r in plan.get("recipes") or []}
        text = "\n".join(
            [
                "Weekmenu: nieuwe gerechten voor één dag.",
                f"week: {plan.get('week')}",
                f"dag: {d['day']} ({logic.DAY_NAMES.get(d['day'], d['day'])} {d.get('date') or ''})".rstrip(),
                f"slot: {d.get('slot') or 'vrij'}",
                f"wens: {wish or '-'}",
                "al opties deze dag: " + "; ".join(str(titles.get(o)) for o in d.get("options") or []),
            ]
        )
        url, token = link
        session = async_get_clientsession(self.hass)
        try:
            async with session.post(
                url,
                json={"text": text},
                headers={
                    "Authorization": f"Bearer {token}",
                    "anthropic-beta": "experimental-cc-routine-2026-04-01",
                    "anthropic-version": "2023-06-01",
                },
                timeout=30,
            ) as resp:
                if resp.status >= 300:
                    body = (await resp.text())[:300]
                    _LOGGER.warning("Claude-taak starten mislukt (%s): %s", resp.status, body)
                    hint = (
                        " Het token klopt niet meer; maak een nieuw token en vul het in bij Weekmenu → Configureren."
                        if resp.status in (401, 403)
                        else ""
                    )
                    raise HomeAssistantError(f"Claude kon niet gestart worden (fout {resp.status}).{hint}")
                data = await resp.json(content_type=None)
        except HomeAssistantError:
            raise
        except Exception as err:  # noqa: BLE001
            raise HomeAssistantError(f"Claude is niet bereikbaar: {err}") from err
        d["pending"] = {
            "at": dt_util.utcnow().isoformat(),
            "wish": wish or None,
            "session_url": (data or {}).get("claude_code_session_url"),
        }
        self.changed()
        return {"day": d["day"], "pending": d["pending"]}

    @callback
    def add_options(
        self, day: str, recipes: list[dict[str, Any]], items: list[dict[str, Any]] | None, week: str | None = None
    ) -> dict[str, Any]:
        """Add new recipe options to one day (called by the Claude task). Choices and the list stay as they are."""
        plan = self._plan()
        if week and plan.get("week") and week != plan["week"]:
            raise HomeAssistantError(f"Voorstel is voor {plan['week']}, niet {week}.")
        try:
            recipes = [schema.RECIPE(r) for r in recipes or []]
            items = schema.validate_items(items or [], "items")
        except schema.PlanInvalid as err:
            raise HomeAssistantError(str(err)) from err
        except Exception as err:  # vol.Invalid from RECIPE
            raise HomeAssistantError(f"Ongeldig recept: {err}") from err
        d = self._day(plan, day)
        used = {r.get("id") for r in plan.get("recipes") or []}
        nums = [int(i[1:]) for i in used if isinstance(i, str) and i[:1] == "r" and i[1:].isdigit()]
        n = max(nums or [0]) + 1
        idmap: dict[str, str] = {}
        added = []
        for i, raw in enumerate(recipes):
            new_id = f"r{n}"
            n += 1
            idmap[str(raw.get("id") or f"new{i}")] = new_id
            r = norm_recipe({**raw, "id": new_id}, new_id)
            r["selected"] = False
            plan["recipes"].append(r)
            d["options"].append(new_id)
            added.append(r)
        new_items = []
        for raw in items:
            rid = idmap.get(str(raw.get("recipe_id")))
            if not rid:
                continue
            new_items.append({**raw, "recipe_id": rid, "source": "recipe", "key": None})
        plan["items"].extend(norm_items(new_items, "recipe"))
        d["pending"] = None
        self.changed()
        self.hass.bus.async_fire(
            f"{DOMAIN}_options_added", {"day": d["day"], "recipes": [r.get("title") for r in added]}
        )
        return {"day": d["day"], "added": [r["id"] for r in added]}

    # ---- price check -------------------------------------------------------
    async def price_check(self) -> dict[str, Any]:
        """Search Picnic for cheaper equivalent products for everything on this week's list."""
        plan = self._editable()
        if plan.get("status") == STATUS_APPROVED:
            raise HomeAssistantError("Deze lijst staat al in je mandje. Tik eerst op Aanpassen.")
        if self._picnic_api() is None:
            raise HomeAssistantError("De Picnic-koppeling in Home Assistant is niet beschikbaar.")
        rows = [
            r
            for r in logic.effective_items(plan)
            if not r.get("removed") and r.get("qty", 0) > 0 and r.get("picnic_id") and r.get("unit_price") is not None
        ]
        sem = asyncio.Semaphore(3)

        async def one(row: dict[str, Any]) -> dict[str, Any] | None:
            async with sem:
                cands = await self._picnic_search(prices.search_query(row["name"]), limit=20)
            alt = prices.best_alternative(row, cands)
            if not alt:
                return None
            return {
                "key": row["key"],
                "current": {
                    "name": row["name"],
                    "qty": row["qty"],
                    "unit_price": row["unit_price"],
                    "unit": alt.pop("current_unit", None),
                    "total": alt.pop("current_total"),
                    "image_id": row.get("image_id"),
                    "recipe": row.get("recipe"),
                },
                "alt": alt,
            }

        found = [s for s in await asyncio.gather(*(one(r) for r in rows)) if s]
        found.sort(key=lambda s: -s["alt"]["saving"])
        return {
            "checked": len(rows),
            "suggestions": found,
            "total_saving": round(sum(s["alt"]["saving"] for s in found), 2),
        }

    @callback
    def apply_prices(self, changes: list[dict[str, Any]]) -> dict[str, Any]:
        """Apply the price-check suggestions the user ticked."""
        plan = self._editable()
        shown = {r["key"]: r for r in logic.effective_items(plan)}
        applied, saving = 0, 0.0
        for ch in changes:
            row, alt = shown.get(ch.get("key")), ch.get("alt") or {}
            if not row or not alt.get("picnic_id") or alt.get("unit_price") is None:
                continue
            new = {
                "name": str(alt["name"]),
                "picnic_id": str(alt["picnic_id"]),
                "image_id": alt.get("image_id"),
                "unit": alt.get("unit"),
                "unit_price": float(alt["unit_price"]),
            }
            if row.get("members"):
                # merged recipe row: remember the swap; amounts keep following the day choices
                orig = float(alt.get("from_size") or 0) / float(row.get("qty_factor") or 1)
                if orig <= 0 or not alt.get("to_size"):
                    continue
                plan.setdefault("swaps", {})[row["key"]] = {**new, "from_size": orig, "to_size": float(alt["to_size"])}
            else:
                item = self._find(row["key"])
                item.update(
                    {**new, "qty": max(1, int(alt.get("qty") or 1)), "promo": None, "note": f"prijscheck: was {item['name']}"}
                )
            applied += 1
            saving += float(alt.get("saving") or 0)
        if applied:
            self.changed()
        return {"applied": applied, "saving": round(saving, 2)}

    # ---- adding things -------------------------------------------------------
    @callback
    def add_item(self, raw: dict[str, Any], qty: int = 1, target: str = "week") -> None:
        item = {**raw, "qty": max(1, min(99, int(qty)))}
        if target == "standard":
            self.standard_add([item])
        else:
            self.add_items([item])

    @callback
    def add_items(self, raw_items: list[dict[str, Any]]) -> None:
        plan = self._editable()
        for new in norm_items(raw_items, "extra"):
            self.restock(new, "added")
            existing = next((i for i in plan["items"] if i["key"] == new["key"]), None)
            if existing:
                existing["qty"] = min(99, (existing["qty"] if not existing["removed"] else 0) + new["qty"])
                existing["removed"] = False
            else:
                plan["items"].append(new)
        self.changed()

    @callback
    def answer_item(self, qid: str, raw: dict[str, Any]) -> None:
        q = self._question(qid)
        it = norm_item({**raw, "qty": raw.get("qty") or 1}, "snack")
        self._clear_answer(qid)
        q["choice"] = "custom"
        q["custom"] = raw.get("name")
        self._plan()["items"].append({**it, "source": "snack", "question": qid, "recipe": q.get("title")})
        self.learn(qid, raw.get("name", ""), [it])
        self.changed()
        self.hass.bus.async_fire(
            f"{DOMAIN}_answer",
            {"question_id": qid, "who": q.get("who"), "option_id": "custom", "title": raw.get("name")},
        )

    @callback
    def michelle_choose(self, option_id: str | None) -> None:
        plan = self._editable()
        m = plan.get("michelle")
        if not m:
            raise HomeAssistantError("Er is deze week geen keuze voor Michelle.")
        opt = None
        if option_id:
            opt = next((o for o in m.get("options") or [] if o["id"] == option_id), None)
            if opt is None:
                raise HomeAssistantError(f"Onbekende optie: {option_id}")
        # remove previous choice's items (only after the new choice is known to be valid)
        plan["items"] = [i for i in plan["items"] if i.get("source") != "michelle"]
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

    @callback
    def unrestock(self, item: dict[str, Any], action: str) -> None:
        """Remove the most recent log entry of this kind for this product (undo)."""
        log = self.data.get("preferences", {}).get("restock_log") or []
        for i in range(len(log) - 1, -1, -1):
            e = log[i]
            if e.get("action") == action and (
                (item.get("picnic_id") and e.get("picnic_id") == item.get("picnic_id")) or e.get("name") == item.get("name")
            ):
                del log[i]
                return

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
                {k: i.get(k) for k in ("name", "picnic_id", "image_id", "unit_price") if i.get(k)} for i in items
            ]
        entries.sort(key=lambda e: (e["count"], e.get("last", "")), reverse=True)
        learned[key] = entries[:12]

    def _question(self, qid: str) -> dict[str, Any]:
        q = next((q for q in self._editable().get("questions") or [] if q["id"] == qid), None)
        if q is None:
            raise HomeAssistantError(f"Onbekende vraag: {qid}")
        return q

    def _clear_answer(self, qid: str) -> None:
        plan = self._plan()
        plan["items"] = [i for i in plan["items"] if i.get("question") != qid]

    @callback
    def answer(self, qid: str, option_id: str | None) -> None:
        q = self._question(qid)
        opt = None
        if option_id:
            opt = next((o for o in q.get("options") or [] if o["id"] == option_id), None)
            if opt is None:
                raise HomeAssistantError(f"Onbekende optie: {option_id}")
        self._clear_answer(qid)
        q["custom"] = None
        q["choice"] = option_id
        if opt:
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
        for it in norm_items(parse_text_items(text), "snack"):
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
        for new in norm_items(raw_items, "standard"):
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
                    i["qty"] = min(99, int(qty))
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
    async def approve(self, allow_open_days: bool = True) -> dict[str, Any]:
        """Send what is not yet in the Picnic cart. Safe to call again: only the difference is added.

        Returns {added, failed, total, days_open, to_remove, failures, ok}. With allow_open_days=False
        and days without a choice nothing happens and {blocked: True, days_open} is returned.
        """
        plan = self._plan()
        if self._approve_lock.locked():
            raise HomeAssistantError("Het mandje wordt al gevuld.")
        async with self._approve_lock:
            open_days = logic.summary(plan)["days_open"] if plan.get("days") else []
            if open_days and not allow_open_days:
                return {"blocked": True, "reason": "days_open", "days_open": open_days, "added": 0, "failed": 0, "total": 0}
            entry = self._picnic_entry()
            if entry is None:
                raise HomeAssistantError("De Picnic-koppeling is niet actief.")
            delta = logic.cart_delta(plan)
            todo = delta["add"]
            sent: dict[str, dict[str, Any]] = plan.setdefault("sent", {})
            before = plan.get("status")
            plan["status"] = STATUS_APPROVING
            plan["progress"] = {"done": 0, "total": len(todo)}
            self.changed()
            results: list[dict[str, Any]] = []
            try:
                for row in todo:
                    data: dict[str, Any] = {"config_entry_id": entry.entry_id, "amount": min(row["qty"], 50)}
                    if row.get("picnic_id"):
                        data["product_id"] = row["picnic_id"]
                    else:
                        data["product_name"] = row["name"]
                    try:
                        await self.hass.services.async_call(PICNIC_DOMAIN, "add_product", data, blocking=True)
                    except Exception as err:  # noqa: BLE001
                        _LOGGER.warning("Picnic add_product mislukt voor %s: %s", row["name"], err)
                        results.append({"key": row["key"], "name": row["name"], "ok": False, "error": str(err)})
                    else:
                        prev = sent.get(row["pkey"]) or {"qty": 0}
                        sent[row["pkey"]] = {"qty": int(prev["qty"]) + data["amount"], "name": row["name"]}
                        results.append({"key": row["key"], "name": row["name"], "ok": True, "qty": data["amount"]})
                        if row.get("source") in ("advice", "extra"):
                            self.restock(row, "bought")
                    plan["progress"]["done"] += 1
                    self.changed()
            finally:
                plan.pop("progress", None)
                ok = sum(1 for r in results if r["ok"])
                failures = [r for r in results if not r["ok"]]
                nothing_sent = bool(todo) and ok == 0
                if nothing_sent:
                    plan["status"] = before if before != STATUS_APPROVING else STATUS_PROPOSED
                else:
                    plan["status"] = STATUS_APPROVED
                    plan["approved_at"] = dt_util.utcnow().isoformat()
                plan["results"] = results
                plan["to_remove"] = delta["remove"]
                self.changed()
            summary = {
                "ok": not nothing_sent,
                "added": ok,
                "failed": len(failures),
                "total": len(results),
                "failures": [{"name": f["name"], "error": f.get("error")} for f in failures],
                "to_remove": delta["remove"],
                "days_open": open_days,
            }
            self.hass.bus.async_fire(f"{DOMAIN}_approved", summary)
            if nothing_sent:
                first = failures[0].get("error") if failures else ""
                raise HomeAssistantError(f"Er is niets in je Picnic-mandje gezet. {first}".strip())
            return summary

    @callback
    def reopen(self) -> None:
        plan = self._editable()
        plan["status"] = STATUS_PROPOSED
        self.changed()

    # ---- cooking timers (server side: survive closing the app, ring via an automation) ----
    @callback
    def timer_start(self, seconds: int, label: str, by: str | None = None, recipe_id: str | None = None) -> dict[str, Any]:
        seconds = max(5, min(int(seconds), 6 * 3600))
        now = dt_util.utcnow()
        t = {
            "id": uuid.uuid4().hex[:8],
            "label": (label or "Timer")[:60],
            "seconds": seconds,
            "start": now.isoformat(),
            "end": (now + timedelta(seconds=seconds)).isoformat(),
            "done": False,
            "by": by,
            "recipe_id": recipe_id,
        }
        self.data.setdefault("timers", []).append(t)
        self._schedule(t)
        self.changed()
        return t

    @callback
    def timer_stop(self, timer_id: str) -> None:
        unsub = self._timer_unsubs.pop(timer_id, None)
        if unsub:
            unsub()
        self.data["timers"] = [t for t in self.data.get("timers") or [] if t["id"] != timer_id]
        self.changed()

    @callback
    def _schedule(self, t: dict[str, Any]) -> None:
        end = dt_util.parse_datetime(t["end"])
        if t["done"]:
            at = end + timedelta(seconds=TIMER_KEEP_SECONDS)
            self._timer_unsubs[t["id"]] = async_track_point_in_utc_time(self.hass, self._make_cleanup(t["id"]), at)
        else:
            self._timer_unsubs[t["id"]] = async_track_point_in_utc_time(self.hass, self._make_ring(t["id"]), end)

    def _make_ring(self, timer_id: str):
        @callback
        def ring(_now) -> None:
            t = next((x for x in self.data.get("timers") or [] if x["id"] == timer_id), None)
            if t is None:
                return
            t["done"] = True
            self.hass.bus.async_fire(f"{DOMAIN}_timer_finished", {"id": t["id"], "label": t["label"], "by": t.get("by")})
            self._schedule(t)
            self.changed()

        return ring

    def _make_cleanup(self, timer_id: str):
        @callback
        def cleanup(_now) -> None:
            self._timer_unsubs.pop(timer_id, None)
            before = len(self.data.get("timers") or [])
            self.data["timers"] = [x for x in self.data.get("timers") or [] if x["id"] != timer_id]
            if len(self.data["timers"]) != before:
                self.changed()

        return cleanup

    @callback
    def _restore_timers(self) -> None:
        now = dt_util.utcnow()
        keep = []
        for t in self.data.get("timers") or []:
            end = dt_util.parse_datetime(t.get("end") or "")
            if end is None or now - end > timedelta(seconds=TIMER_KEEP_SECONDS):
                continue
            if not t.get("done") and end <= now:
                t["done"] = True  # rang while Home Assistant was down
            keep.append(t)
            self._schedule(t)
        self.data["timers"] = keep
