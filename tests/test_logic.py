"""Tests for the per-day menu logic (no Home Assistant needed)."""
import importlib.util
from pathlib import Path

import pytest

_spec = importlib.util.spec_from_file_location(
    "logic", Path(__file__).resolve().parents[1] / "custom_components" / "weekmenu" / "logic.py"
)
logic = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(logic)


def item(name, rid=None, qty=1, price=1.0, pid=None, source=None, removed=False):
    key = f"p-{pid}" if pid else f"n-{name.lower()}"
    if rid:
        key += f"@{rid}"
    return {"key": key, "name": name, "qty": qty, "unit_price": price, "picnic_id": pid,
            "source": source or ("recipe" if rid else "standard"), "recipe_id": rid,
            "recipe": f"Recept {rid}" if rid else None, "removed": removed}


@pytest.fixture
def plan():
    recipes = [{"id": f"r{i}", "title": f"Recept r{i}", "price": 10.0 + i} for i in range(1, 6)]
    days = logic.norm_days(
        [
            {"day": "ma", "date": "2026-11-30", "slot": "AGV", "options": ["r1", "r2", "r3"], "choice": None},
            {"day": "di", "date": "2026-12-01", "slot": "pasta", "options": ["r4", "r5", "r1"], "choice": None, "note": "Michelle eet niet thuis"},
            {"day": "wo", "options": ["r2", "r3", "onbekend"], "choice": "r9"},
        ],
        {r["id"] for r in recipes},
    )
    items = [
        item("Melk", qty=2, price=1.19, pid="s1"),
        item("Ui", rid="r1", qty=2, price=0.5, pid="s10"),
        item("Ui", rid="r4", qty=1, price=0.5, pid="s10"),
        item("Zalm", rid="r1", qty=1, price=7.0, pid="s11"),
        item("Pasta", rid="r4", qty=1, price=1.5, pid="s12"),
        item("Kip", rid="r2", qty=1, price=5.0, pid="s13"),
    ]
    p = {"recipes": recipes, "days": days, "items": items}
    logic.sync_selected(p)
    return p


def test_norm_days_filters_unknown_options_and_choices(plan):
    wo = next(d for d in plan["days"] if d["day"] == "wo")
    assert wo["options"] == ["r2", "r3"]
    assert wo["choice"] is None  # r9 geen optie
    assert next(d for d in plan["days"] if d["day"] == "di")["note"] == "Michelle eet niet thuis"


def test_geen_keuze_geen_receptitems(plan):
    keys = [i["key"] for i in logic.effective_items(plan)]
    assert keys == ["p-s1"]  # alleen de vaste boodschap
    s = logic.summary(plan)
    assert (s["days_chosen"], s["days_total"], s["days_open"]) == (0, 3, ["ma", "di", "wo"])


def test_keuze_telt_mee_en_gedeelde_ingredienten_eenmaal(plan):
    logic.choose_day(plan, "ma", "r1")
    logic.choose_day(plan, "di", "r4")
    rows = {i["key"]: i for i in logic.effective_items(plan)}
    assert set(rows) == {"p-s1", "p-s10", "p-s11", "p-s12"}
    assert rows["p-s10"]["qty"] == 3  # ui: 2 (r1) + 1 (r4)
    assert rows["p-s10"]["recipe"] == "Recept r1 + Recept r4"
    assert [r["selected"] for r in plan["recipes"]] == [True, False, False, True, False]
    s = logic.summary(plan)
    assert s["recipe_price"] == 25.0  # r1 11 + r4 14
    assert s["items_total"] == round(2 * 1.19 + 3 * 0.5 + 7 + 1.5, 2)


def test_niets_koken_telt_als_gekozen(plan):
    logic.choose_day(plan, "wo", "none")
    s = logic.summary(plan)
    assert s["days_chosen"] == 1 and "wo" not in s["days_open"]
    assert s["recipe_price"] == 0


def test_recept_maar_op_een_dag(plan):
    logic.choose_day(plan, "ma", "r1")
    res = logic.choose_day(plan, "di", "r1")
    assert res["moved_from"] == "ma"
    assert next(d for d in plan["days"] if d["day"] == "ma")["choice"] is None


def test_ongedaan_maken(plan):
    logic.choose_day(plan, "ma", "r1")
    logic.choose_day(plan, "ma", None)
    assert logic.effective_items(plan)[0]["key"] == "p-s1" and len(logic.effective_items(plan)) == 1
    assert not plan["recipes"][0]["selected"]


def test_ongeldige_keuze(plan):
    with pytest.raises(logic.PlanError):
        logic.choose_day(plan, "ma", "r4")
    with pytest.raises(logic.PlanError):
        logic.choose_day(plan, "za", "r1")


def test_samengevoegde_rij_aanpassen_en_weghalen(plan):
    logic.choose_day(plan, "ma", "r1")
    logic.choose_day(plan, "di", "r4")
    logic.set_qty(plan, "p-s10", 5)
    assert next(i for i in logic.effective_items(plan) if i["key"] == "p-s10")["qty"] == 5
    logic.set_qty(plan, "p-s10", 1)
    assert next(i for i in logic.effective_items(plan) if i["key"] == "p-s10")["qty"] == 1
    logic.set_removed(plan, "p-s10", True)
    row = next(i for i in logic.effective_items(plan) if i["key"] == "p-s10")
    assert row["removed"] and row["qty"] == 0
    logic.set_removed(plan, "p-s10", False)
    assert next(i for i in logic.effective_items(plan) if i["key"] == "p-s10")["qty"] >= 1


def test_oud_plan_zonder_days_ongewijzigd():
    p = {"recipes": [{"id": "r1"}], "items": [item("Ui", rid="r1"), item("Melk")]}
    assert logic.effective_items(p) == p["items"]
    assert logic.chosen_ids(p) is None
    with pytest.raises(logic.PlanError):
        logic.choose_day(p, "ma", "r1")


def test_grote_verpakking_bij_twee_recepten(plan):
    # kip 400 g €5,69 in r2 en r5 (andere dagen); 1 kg-pak = 2 kleine voor €9,99
    bulk = {"name": "Kipdijfilet 1 kg", "picnic_id": "s99", "unit_price": 9.99, "replaces": 2}
    k2 = item("Kip", rid="r2", qty=1, price=5.69, pid="s13")
    k5 = item("Kip", rid="r5", qty=1, price=5.69, pid="s13")
    k2["bulk"] = logic.norm_bulk(bulk)
    plan["items"] = [i for i in plan["items"] if i["picnic_id"] != "s13"] + [k2, k5]
    logic.choose_day(plan, "ma", "r2")
    row = next(i for i in logic.effective_items(plan) if i["key"] == "p-s13")
    assert (row["name"], row["qty"]) == ("Kip", 1)  # één recept: klein pak
    logic.choose_day(plan, "di", "r5")
    row = next(i for i in logic.effective_items(plan) if i["key"] == "p-s13")
    assert (row["picnic_id"], row["qty"], row["bulk_saving"]) == ("s99", 1, 1.39)
    assert "goedkoper" in row["note"]
    assert logic.summary(plan)["items_total"] == round(2 * 1.19 + 9.99, 2)
    # +1 op de grote rij = nog een groot pak (2 kleine porties erbij)
    logic.set_qty(plan, "p-s13", 2)
    row = next(i for i in logic.effective_items(plan) if i["key"] == "p-s13")
    assert (row["picnic_id"], row["qty"]) == ("s99", 2)


def test_grote_verpakking_alleen_als_goedkoper():
    p = {"recipes": [{"id": "r1"}, {"id": "r2"}], "days": logic.norm_days(
        [{"day": "ma", "options": ["r1"]}, {"day": "di", "options": ["r2"]}], {"r1", "r2"})}
    a = item("Pasta", rid="r1", qty=1, price=1.0, pid="s5")
    b = item("Pasta", rid="r2", qty=1, price=1.0, pid="s5")
    a["bulk"] = logic.norm_bulk({"name": "Pasta 1 kg", "picnic_id": "s6", "unit_price": 2.2, "replaces": 2})
    p["items"] = [a, b]
    logic.choose_day(p, "ma", "r1")
    logic.choose_day(p, "di", "r2")
    row = logic.effective_items(p)[0]
    assert (row["picnic_id"], row["qty"]) == ("s5", 2)
    assert logic.norm_bulk({"name": "x", "picnic_id": "s1", "unit_price": 1, "replaces": 1}) is None
