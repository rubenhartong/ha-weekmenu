"""Price check: find cheaper equivalent Picnic products (pure, unit-testable).

Sizes are normalised to a base unit: grams ("g"), millilitres ("ml") or pieces ("st").
"""

from __future__ import annotations

import math
import re
from typing import Any

_UNITS = {
    "g": ("g", 1), "gr": ("g", 1), "gram": ("g", 1), "grams": ("g", 1),
    "kg": ("g", 1000), "kilo": ("g", 1000), "kilogram": ("g", 1000),
    "ml": ("ml", 1), "cl": ("ml", 10), "dl": ("ml", 100),
    "l": ("ml", 1000), "liter": ("ml", 1000), "litre": ("ml", 1000),
    "st": ("st", 1), "stuk": ("st", 1), "stuks": ("st", 1), "x": ("st", 1),
    "plakken": ("st", 1), "rollen": ("st", 1), "zakjes": ("st", 1), "eieren": ("st", 1),
}
_NUM = r"(\d+(?:[.,]\d+)?)"
_MULTI_RE = re.compile(rf"(\d+)\s*[x×]\s*{_NUM}\s*([a-z]+)\b")
_SIZE_RE = re.compile(rf"{_NUM}\s*([a-z]+)\b")
_PER_RE = re.compile(r"€\s*" + _NUM + r"\s*/\s*([a-z]+)")

_STOP = {
    "picnic", "bio", "biologisch", "verse", "vers", "de", "het", "een", "met", "en", "van", "in", "op",
    "zak", "zakje", "bakje", "pak", "pakje", "fles", "pot", "blik", "doos", "los", "stuks", "stuk",
    "gram", "kilo", "kg", "g", "gr", "liter", "l", "ml", "cl", "x", "mix", "per", "ca", "voordeel",
    "voordeelverpakking", "grootverpakking", "naturel", "huismerk", "zero", "light",
}


def _num(s: str) -> float:
    return float(s.replace(",", "."))


def parse_size(text: str | None) -> tuple[float, str] | None:
    """'400 gram' -> (400, 'g'); '2 x 500 ml' -> (1000, 'ml'); '1,5 kilo' -> (1500, 'g'); '6 stuks' -> (6, 'st')."""
    if not text:
        return None
    t = str(text).lower().replace("×", "x")
    m = _MULTI_RE.search(t)
    if m and m.group(3) in _UNITS and m.group(3) != "x":
        base, mult = _UNITS[m.group(3)]
        return int(m.group(1)) * _num(m.group(2)) * mult, base
    for m in _SIZE_RE.finditer(t):
        unit = m.group(2)
        if unit in _UNITS and unit != "x":
            base, mult = _UNITS[unit]
            amount = _num(m.group(1)) * mult
            if amount > 0:
                return amount, base
    if re.search(r"\bper stuk\b|\b1 stuk\b", t):
        return 1.0, "st"
    return None


def words(name: str | None) -> list[str]:
    """Significant words of a product name (no sizes, brands-ish noise or stop words)."""
    out = []
    for w in re.findall(r"[a-zà-ÿ]+", (name or "").lower()):
        if len(w) < 3 or w in _STOP or w in _UNITS:
            continue
        out.append(w)
    return out


def search_query(name: str | None) -> str:
    ws = words(name)
    # the last words carry the product type ("Picnic gelderse rookworst" -> "gelderse rookworst")
    return " ".join(ws[-3:]) if ws else (name or "")


def _stem(w: str) -> str:
    """Rough Dutch stem for plurals: 'tomaten'/'tomaat' -> 'tomat', 'eieren'/'ei' stays apart."""
    for suf in ("en", "s", "e", "n"):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            w = w[: -len(suf)]
            break
    for v in "aeou":
        w = w.replace(v + v, v)
    return w


def _same_word(a: str, b: str) -> bool:
    """Same word or its plural. No matching inside words: 'melk' is not 'karnemelk',
    'volle' is not 'halfvolle' and 'aardappelen' is not 'aardappelpuree'."""
    return a == b or _stem(a) == _stem(b)


def similar(current: str, candidate: str) -> bool:
    """Candidate is the same kind of product, checked both ways (no extra words that change the product)."""
    cw, kw = words(current), words(candidate)
    if not cw or not kw:
        return False
    hits = sum(1 for w in cw if any(_same_word(w, k) for k in kw))
    back = sum(1 for k in kw if any(_same_word(k, w) for w in cw))
    return hits / len(cw) >= 0.67 and back / len(kw) > 0.5


def per_unit(price: float | None, size: tuple[float, str] | None) -> float | None:
    if price is None or not size or size[0] <= 0:
        return None
    return price / size[0]


def best_alternative(row: dict[str, Any], candidates: list[dict[str, Any]], min_saving: float = 0.15) -> dict[str, Any] | None:
    """Cheapest equivalent product for a list row, covering the same amount. None when nothing is cheaper.

    row: {name, picnic_id, qty, unit_price, unit?}; candidates: search results {name, picnic_id, unit, unit_price, image_id}.
    """
    qty = int(row.get("qty") or 0)
    price = row.get("unit_price")
    if qty <= 0 or price is None:
        return None
    me = next((c for c in candidates if c.get("picnic_id") and c.get("picnic_id") == row.get("picnic_id")), None)
    size = parse_size(row.get("unit")) or parse_size((me or {}).get("unit")) or parse_size(row.get("name"))
    if not size:
        return None
    need = qty * size[0]
    cost = qty * float(price)
    best = None
    for c in candidates:
        if not c.get("picnic_id") or c.get("picnic_id") == row.get("picnic_id") or c.get("unit_price") is None:
            continue
        csize = parse_size(c.get("unit")) or parse_size(c.get("name"))
        if not csize or csize[1] != size[1] or not similar(row.get("name", ""), c.get("name", "")):
            continue
        cqty = max(1, math.ceil(need / csize[0] - 1e-9))
        amount = cqty * csize[0]
        if amount < need * 0.9 or amount > need * 2:  # te weinig, of veel te veel over
            continue
        ccost = cqty * float(c["unit_price"])
        saving = cost - ccost
        if saving < min_saving or saving < cost * 0.05:
            continue
        if best is None or saving > best["saving"]:
            bigger = csize[0] > size[0] * 1.2
            best = {
                "name": c["name"],
                "picnic_id": c["picnic_id"],
                "image_id": c.get("image_id"),
                "unit": c.get("unit"),
                "unit_price": float(c["unit_price"]),
                "qty": cqty,
                "total": round(ccost, 2),
                "saving": round(saving, 2),
                "from_size": size[0],
                "to_size": csize[0],
                "reason": "grotere verpakking" if bigger else "goedkoper per " + {"g": "kilo", "ml": "liter", "st": "stuk"}[size[1]],
            }
    if best:
        best["current_total"] = round(cost, 2)
        best["current_unit"] = row.get("unit") or (me or {}).get("unit")
    return best
