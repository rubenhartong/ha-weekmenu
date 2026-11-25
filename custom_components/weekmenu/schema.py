"""Validation of the week plan Claude delivers, and date parsing (no Home Assistant imports).

An LLM writes the plan, so the checks are strict on what the app relies on (names, numbers,
ids that point to each other) and lenient on everything else (extra keys are kept). Errors
name the exact place ("items[3].qty") so Claude can fix them in one go.
"""

from __future__ import annotations

import re
from datetime import date, datetime, tzinfo
from typing import Any

import voluptuous as vol

from .const import SOURCES

DAY_KEYS = ("ma", "di", "wo", "do", "vr", "za", "zo")


class PlanInvalid(ValueError):
    """The plan does not match the format; message is meant for Claude and the log."""


def _opt_str(v: Any) -> str | None:
    if v is None or v == "":
        return None
    if isinstance(v, (dict, list)):
        raise vol.Invalid("verwacht tekst")
    return str(v)


def _num(v: Any) -> float | None:
    if v is None or v == "":
        return None
    if isinstance(v, bool):
        raise vol.Invalid("verwacht een getal")
    if isinstance(v, str):
        v = v.replace("€", "").replace(",", ".").strip()
    try:
        return float(v)
    except (TypeError, ValueError) as err:
        raise vol.Invalid("verwacht een getal") from err


def _int(v: Any) -> int | None:
    n = _num(v)
    if n is None:
        return None
    if n != int(n):
        raise vol.Invalid("verwacht een heel getal")
    return int(n)


def _https(v: Any) -> str | None:
    v = _opt_str(v)
    if v and not v.startswith("https://"):
        raise vol.Invalid("moet een https-URL zijn")
    return v


def _day(v: Any) -> str:
    d = str(v or "").strip().lower()[:2]
    if d not in DAY_KEYS:
        raise vol.Invalid("verwacht ma, di, wo, do, vr, za of zo")
    return d


def _iso_date(v: Any) -> str | None:
    v = _opt_str(v)
    if v and not re.match(r"^\d{4}-\d{2}-\d{2}$", v):
        raise vol.Invalid("verwacht JJJJ-MM-DD")
    return v


def _step(v: Any) -> dict[str, Any]:
    if isinstance(v, str):
        return {"text": v}
    return STEP(v)


STEP = vol.Schema({vol.Required("text"): str, vol.Optional("timer_sec"): vol.All(_int, vol.Any(None, vol.Range(min=0, max=6 * 3600)))}, extra=vol.ALLOW_EXTRA)

PROMO = vol.Any(None, vol.Schema({vol.Optional("label"): _opt_str, vol.Optional("saving"): _num}, extra=vol.ALLOW_EXTRA))

ITEM = vol.Schema(
    {
        vol.Required("name"): vol.All(str, vol.Length(min=1)),
        vol.Optional("picnic_id"): _opt_str,
        vol.Optional("image_id"): _opt_str,
        vol.Optional("qty"): vol.All(_int, vol.Any(None, vol.Range(min=0, max=99))),
        vol.Optional("unit_price"): vol.All(_num, vol.Any(None, vol.Range(min=0, max=500))),
        vol.Optional("source"): vol.Any(None, vol.In(SOURCES)),
        vol.Optional("recipe_id"): _opt_str,
        vol.Optional("promo"): PROMO,
        vol.Optional("bulk"): vol.Any(None, dict),
    },
    extra=vol.ALLOW_EXTRA,
)

RECIPE = vol.Schema(
    {
        vol.Optional("id"): _opt_str,
        vol.Required("title"): vol.All(str, vol.Length(min=1)),
        vol.Optional("image_url"): _https,
        vol.Optional("minutes"): vol.All(_int, vol.Any(None, vol.Range(min=0, max=24 * 60))),
        vol.Optional("price"): _num,
        vol.Optional("ingredients"): [vol.Any(str, dict)],
        vol.Optional("pantry"): [str],
        vol.Optional("steps"): [_step],
        vol.Optional("tips"): vol.Any(None, dict),
    },
    extra=vol.ALLOW_EXTRA,
)

DAY = vol.Schema(
    {
        vol.Required("day"): _day,
        vol.Optional("date"): _iso_date,
        vol.Optional("options"): [vol.Coerce(str)],
        vol.Optional("choice"): _opt_str,
    },
    extra=vol.ALLOW_EXTRA,
)

OPTION = vol.Schema({vol.Optional("id"): _opt_str, vol.Optional("title"): _opt_str, vol.Optional("items"): [ITEM]}, extra=vol.ALLOW_EXTRA)

PLAN = vol.Schema(
    {
        vol.Optional("week"): vol.Any(None, vol.Match(r"^\d{4}-W\d{2}$", msg="verwacht JJJJ-Www, bijv. 2026-W49")),
        vol.Optional("delivery"): _opt_str,
        vol.Optional("order_deadline"): _opt_str,
        vol.Optional("delivery_at"): _opt_str,
        vol.Optional("order_deadline_at"): _opt_str,
        vol.Optional("recipes"): [RECIPE],
        vol.Optional("items"): [ITEM],
        vol.Optional("days"): vol.Any(None, [DAY]),
        vol.Optional("michelle"): vol.Any(None, vol.Schema({vol.Optional("options"): [OPTION]}, extra=vol.ALLOW_EXTRA)),
        vol.Optional("questions"): [vol.Schema({vol.Optional("id"): _opt_str, vol.Optional("options"): [OPTION]}, extra=vol.ALLOW_EXTRA)],
    },
    extra=vol.ALLOW_EXTRA,
)


def _path(err: vol.Invalid) -> str:
    out = ""
    for p in err.path:
        out += f"[{p}]" if isinstance(p, int) else (f".{p}" if out else str(p))
    return out or "plan"


def _raise(errors: list[str]) -> None:
    if errors:
        more = f" (+{len(errors) - 6} meer)" if len(errors) > 6 else ""
        raise PlanInvalid("Ongeldig weekvoorstel: " + "; ".join(errors[:6]) + more)


def validate_plan(raw: Any) -> dict[str, Any]:
    """Validate and coerce a plan. Raises PlanInvalid with readable paths."""
    if not isinstance(raw, dict):
        raise PlanInvalid("Ongeldig weekvoorstel: plan moet een object zijn.")
    try:
        plan = PLAN(raw)
    except vol.MultipleInvalid as err:
        _raise([f"{_path(e)}: {e.msg}" for e in err.errors])
    except vol.Invalid as err:
        _raise([f"{_path(err)}: {err.msg}"])

    # cross references
    errors: list[str] = []
    ids = [str(r.get("id") or f"r{i + 1}") for i, r in enumerate(plan.get("recipes") or [])]
    dup = sorted({i for i in ids if ids.count(i) > 1})
    if dup:
        errors.append(f"recipes: dubbele id {', '.join(dup)}")
    known = set(ids)
    for i, it in enumerate(plan.get("items") or []):
        rid = it.get("recipe_id")
        if rid and rid not in known:
            errors.append(f"items[{i}].recipe_id: recept {rid} bestaat niet")
        if it.get("source") == "recipe" and not rid and plan.get("days"):
            errors.append(f"items[{i}]: recept-ingrediënt zonder recipe_id")
    days = plan.get("days") or []
    seen_days = [d["day"] for d in days]
    if len(seen_days) != len(set(seen_days)):
        errors.append("days: een dag staat er twee keer in")
    for i, d in enumerate(days):
        for o in d.get("options") or []:
            if o not in known:
                errors.append(f"days[{i}].options: recept {o} bestaat niet")
    _raise(errors)
    return plan


def validate_items(raw: Any, label: str = "items") -> list[dict[str, Any]]:
    try:
        return vol.Schema([ITEM])(raw or [])
    except vol.MultipleInvalid as err:
        _raise([f"{label}{_path(e) if _path(e).startswith('[') else '.' + _path(e)}: {e.msg}" for e in err.errors])
    return []


# ---- dates -------------------------------------------------------------------

_MONTHS = {
    "jan": 1, "feb": 2, "mrt": 3, "maa": 3, "mar": 3, "apr": 4, "mei": 5, "may": 5, "jun": 6, "jul": 7,
    "aug": 8, "sep": 9, "okt": 10, "oct": 10, "nov": 11, "dec": 12,
}
_TEXT_RE = re.compile(r"(\d{1,2})\s+([a-z]{3})[a-z]*\.?\s+(?:om\s+)?(\d{1,2})[:.](\d{2})")


def week_monday(week: str | None) -> date | None:
    m = re.match(r"^(\d{4})-W(\d{2})$", str(week or ""))
    if not m:
        return None
    try:
        return date.fromisocalendar(int(m.group(1)), int(m.group(2)), 1)
    except ValueError:
        return None


def parse_when(value: Any, week: str | None, tz: tzinfo, today: date | None = None) -> datetime | None:
    """ISO timestamp, or Dutch text like 'za 5 dec 13:00' (year from the plan week). Aware datetime or None."""
    if not value:
        return None
    text = str(value).strip()
    try:
        dt = datetime.fromisoformat(text)
    except ValueError:
        dt = None
    if dt is not None:
        return dt if dt.tzinfo else dt.replace(tzinfo=tz)
    m = _TEXT_RE.search(text.lower())
    if not m or m.group(2) not in _MONTHS:
        return None
    day, month, hh, mm = int(m.group(1)), _MONTHS[m.group(2)], int(m.group(3)), int(m.group(4))
    ref = week_monday(week) or today or date.today()
    best = None
    for year in (ref.year - 1, ref.year, ref.year + 1):
        try:
            cand = date(year, month, day)
        except ValueError:
            continue
        if best is None or abs((cand - ref).days) < abs((best - ref).days):
            best = cand
    if best is None or abs((best - ref).days) > 60 or hh > 23 or mm > 59:
        return None
    return datetime(best.year, best.month, best.day, hh, mm, tzinfo=tz)


def iso_or_none(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None

