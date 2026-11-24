"""Pure plan logic for the per-day menu (no Home Assistant imports, unit-testable).

Plan with `days`:
  days: [{day: "ma", date: "2026-11-30", slot: "AGV", options: ["r1", "r2"], choice: None|"r2"|"none", note}]
  - choice None   -> nog kiezen (bij akkoord: telt als niets koken)
  - choice "none" -> niets koken
  - choice "rX"   -> dat recept; een recept kan maar op één dag gekozen zijn
Recipe items (source "recipe") carry `recipe_id`; only items of chosen recipes count for
totals, the proposal and the Picnic cart. Shared ingredients count once (quantities added).
Plans without `days` behave as before: all items count.
"""

from __future__ import annotations

import copy
from typing import Any

NONE = "none"
DAY_NAMES = {
    "ma": "maandag",
    "di": "dinsdag",
    "wo": "woensdag",
    "do": "donderdag",
    "vr": "vrijdag",
    "za": "zaterdag",
    "zo": "zondag",
}


class PlanError(ValueError):
    """Invalid input; shown to the user."""


def base_key(key: str) -> str:
    """Product key without the recipe suffix (``p-s123@r2`` -> ``p-s123``)."""
    return key.split("@", 1)[0]


def norm_days(raw_days: list[dict[str, Any]] | None, recipe_ids: set[str]) -> list[dict[str, Any]] | None:
    if not raw_days:
        return None
    days: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw in raw_days:
        day = str(raw.get("day", "")).strip().lower()[:2]
        if not day or day in seen:
            continue
        seen.add(day)
        options = [str(o) for o in raw.get("options") or [] if str(o) in recipe_ids]
        choice = raw.get("choice")
        if choice not in (None, NONE) and str(choice) not in options:
            choice = None
        days.append(
            {
                "day": day,
                "date": raw.get("date"),
                "slot": raw.get("slot"),
                "note": raw.get("note"),
                "options": list(dict.fromkeys(options)),
                "choice": choice if choice in (None, NONE) else str(choice),
            }
        )
    # a recipe chosen on two days in the input: keep the first
    used: set[str] = set()
    for d in days:
        c = d["choice"]
        if c not in (None, NONE):
            if c in used:
                d["choice"] = None
            used.add(c)
    return days


def chosen_ids(plan: dict[str, Any]) -> set[str] | None:
    """Recipe ids chosen on a day; None when the plan has no days (old format: all count)."""
    days = plan.get("days")
    if not days:
        return None
    return {d["choice"] for d in days if d.get("choice") not in (None, NONE)}


def sync_selected(plan: dict[str, Any]) -> None:
    chosen = chosen_ids(plan)
    if chosen is None:
        return
    for r in plan.get("recipes") or []:
        r["selected"] = r.get("id") in chosen


def choose_day(plan: dict[str, Any], day: str, choice: str | None) -> dict[str, Any]:
    """Set the choice for a day. Returns info about what changed (moved_from: day it was taken from)."""
    days = plan.get("days")
    if not days:
        raise PlanError("Dit weekvoorstel heeft geen keuze per dag.")
    day = str(day).strip().lower()[:2]
    target = next((d for d in days if d["day"] == day), None)
    if target is None:
        raise PlanError(f"Onbekende dag: {day}")
    moved_from = None
    if choice not in (None, NONE):
        choice = str(choice)
        if choice not in target["options"]:
            raise PlanError(f"Recept {choice} is geen optie voor {DAY_NAMES.get(day, day)}.")
        for d in days:
            if d is not target and d.get("choice") == choice:
                d["choice"] = None
                moved_from = d["day"]
    target["choice"] = choice
    sync_selected(plan)
    return {"day": day, "choice": choice, "moved_from": moved_from}


def effective_items(plan: dict[str, Any]) -> list[dict[str, Any]]:
    """Items that count now: recipe items only for chosen recipes, one row per product."""
    items = plan.get("items") or []
    chosen = chosen_ids(plan)
    if chosen is None:
        return list(items)
    out: list[dict[str, Any]] = []
    rows: dict[str, dict[str, Any]] = {}
    for it in items:
        rid = it.get("recipe_id")
        if not (it.get("source") == "recipe" and rid):
            out.append(it)
            continue
        if rid not in chosen:
            continue
        bk = base_key(it["key"])
        row = rows.get(bk)
        if row is None:
            row = {**copy.deepcopy(it), "key": bk, "qty": 0, "members": [], "recipes": []}
            rows[bk] = row
            out.append(row)
        row["members"].append(it["key"])
        if not it.get("removed"):
            row["qty"] += max(0, int(it.get("qty", 0)))
        if it.get("recipe") and it["recipe"] not in row["recipes"]:
            row["recipes"].append(it["recipe"])
    for row in rows.values():
        row["removed"] = row["qty"] == 0
        row["recipe"] = " + ".join(row["recipes"]) or row.get("recipe")
    return out


def members(plan: dict[str, Any], key: str) -> list[dict[str, Any]]:
    """Stored items behind a (possibly merged) list key."""
    items = plan.get("items") or []
    exact = [i for i in items if i["key"] == key]
    if exact:
        return exact
    return [i for i in items if i.get("source") == "recipe" and base_key(i["key"]) == key]


def set_qty(plan: dict[str, Any], key: str, qty: int) -> None:
    """Set the total quantity of a (merged) row. Other members keep their share; the first takes the rest."""
    ms = members(plan, key)
    if not ms:
        raise PlanError(f"Onbekend product: {key}")
    chosen = chosen_ids(plan)
    active = [m for m in ms if chosen is None or m.get("source") != "recipe" or m.get("recipe_id") in chosen] or ms
    qty = max(0, int(qty))
    first, others = active[0], active[1:]
    rest = sum(o["qty"] for o in others if not o.get("removed"))
    if qty >= rest:
        first["qty"] = qty - rest
    else:
        first["qty"] = qty
        for o in others:
            o["qty"] = 0
    for m in active:
        m["removed"] = m["qty"] == 0


def set_removed(plan: dict[str, Any], key: str, removed: bool) -> list[dict[str, Any]]:
    ms = members(plan, key)
    if not ms:
        raise PlanError(f"Onbekend product: {key}")
    for m in ms:
        m["removed"] = removed
        if not removed and m["qty"] == 0:
            m["qty"] = 1
    return ms


def summary(plan: dict[str, Any]) -> dict[str, Any]:
    """Numbers for the panel and the approve step."""
    days = plan.get("days") or []
    recipes = {r.get("id"): r for r in plan.get("recipes") or []}
    chosen_days = [d for d in days if d.get("choice") not in (None,)]
    recipe_price = sum(
        float(recipes[d["choice"]].get("price") or 0)
        for d in days
        if d.get("choice") not in (None, NONE) and d["choice"] in recipes
    )
    active = [i for i in effective_items(plan) if not i.get("removed") and i.get("qty", 0) > 0]
    total = sum(float(i["unit_price"]) * i["qty"] for i in active if i.get("unit_price") is not None)
    return {
        "days_total": len(days),
        "days_chosen": len(chosen_days),
        "days_open": [d["day"] for d in days if d.get("choice") is None],
        "recipe_price": round(recipe_price, 2),
        "items_total": round(total, 2),
        "items_count": len(active),
    }


def view(plan: dict[str, Any] | None) -> dict[str, Any] | None:
    """Computed, read-only view sent to the panel next to the stored plan."""
    if not plan:
        return None
    return {"items": effective_items(plan), "summary": summary(plan)}
