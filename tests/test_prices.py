"""Tests for the price check (no Home Assistant needed)."""
import importlib.util
from pathlib import Path

_base = Path(__file__).resolve().parents[1] / "custom_components" / "weekmenu"


def _load(name):
    spec = importlib.util.spec_from_file_location(name, _base / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


prices = _load("prices")
logic = _load("logic")


def test_parse_size():
    assert prices.parse_size("400 gram") == (400, "g")
    assert prices.parse_size("1 kilo") == (1000, "g")
    assert prices.parse_size("1,5 liter") == (1500, "ml")
    assert prices.parse_size("2 x 500 ml") == (1000, "ml")
    assert prices.parse_size("6 x 33 cl") == (1980, "ml")
    assert prices.parse_size("10 stuks") == (10, "st")
    assert prices.parse_size("Kipdijfiletreepjes 400 g") == (400, "g")
    assert prices.parse_size("ca. 1 stuk") == (1, "st")
    assert prices.parse_size("lekker") is None


def test_similar_en_query():
    assert prices.search_query("Picnic gelderse rookworst 275 g") == "gelderse rookworst"
    assert prices.similar("Kipdijfiletreepjes 400 g", "Picnic kipdijfiletreepjes 1 kilo")
    assert not prices.similar("Picnic boerenkool fijngesneden", "Picnic andijvie fijngesneden")
    assert not prices.similar("Kruimige aardappelen 1 kilo", "Kruimige aardappelpuree")


CANDS = [
    {"name": "Kipdijfiletreepjes", "picnic_id": "s1", "unit": "400 gram", "unit_price": 5.69},
    {"name": "Picnic kipdijfiletreepjes", "picnic_id": "s2", "unit": "400 gram", "unit_price": 4.49},
    {"name": "Picnic kipdijfiletreepjes", "picnic_id": "s3", "unit": "1 kilo", "unit_price": 7.99},
    {"name": "Kipfilet blokjes", "picnic_id": "s4", "unit": "400 gram", "unit_price": 3.99},
]


def test_goedkoper_zelfde_maat():
    row = {"name": "Kipdijfiletreepjes", "picnic_id": "s1", "qty": 1, "unit_price": 5.69}
    alt = prices.best_alternative(row, CANDS)
    assert (alt["picnic_id"], alt["qty"], alt["saving"]) == ("s2", 1, 1.2)
    assert alt["reason"] == "goedkoper per kilo"


def test_grote_verpakking_bij_meer_nodig():
    row = {"name": "Kipdijfiletreepjes", "picnic_id": "s1", "qty": 2, "unit_price": 5.69}  # 800 g
    alt = prices.best_alternative(row, CANDS)
    assert (alt["picnic_id"], alt["qty"], alt["reason"]) == ("s3", 1, "grotere verpakking")
    assert alt["saving"] == round(2 * 5.69 - 7.99, 2)


def test_niets_goedkoper():
    row = {"name": "Picnic kipdijfiletreepjes", "picnic_id": "s2", "qty": 1, "unit_price": 4.49}
    assert prices.best_alternative(row, CANDS) is None  # 1 kg is te veel voor 400 g


def test_swap_volgt_keuzes():
    p = {"recipes": [{"id": "r1"}, {"id": "r2"}],
         "days": logic.norm_days([{"day": "ma", "options": ["r1"]}, {"day": "di", "options": ["r2"]}], {"r1", "r2"})}
    a = {"key": "p-s1@r1", "name": "Kip", "qty": 1, "unit_price": 5.69, "picnic_id": "s1", "source": "recipe", "recipe_id": "r1"}
    b = {**a, "key": "p-s1@r2", "recipe_id": "r2"}
    p["items"] = [a, b]
    logic.choose_day(p, "ma", "r1")
    p["swaps"] = {"p-s1": {"name": "Kip 1 kg", "picnic_id": "s3", "unit_price": 9.99, "from_size": 400, "to_size": 1000}}
    row = logic.effective_items(p)[0]
    assert (row["picnic_id"], row["qty"]) == ("s3", 1)
    logic.choose_day(p, "di", "r2")  # 800 g nodig -> nog steeds 1 kg
    assert logic.effective_items(p)[0]["qty"] == 1
    logic.set_qty(p, "p-s1", 2)  # 2 kg -> 5 pakjes van 400 g
    assert sum(i["qty"] for i in p["items"]) == 5
    assert logic.effective_items(p)[0]["qty"] == 2
