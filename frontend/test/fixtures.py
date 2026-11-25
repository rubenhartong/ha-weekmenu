"""Build panel snapshots with the real Python logic (for screenshot tests).

Run from the repo root: python3 frontend/test/fixtures.py  -> frontend/test/fixtures.json
"""
import asyncio
import copy
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tests"))
import test_manager as tm  # noqa: E402  (installs the Home Assistant stubs)

wm = tm.weekmenu
IMG = "https://storefront-prod.nl.picnicinternational.com/static/images/recipes/{}/600x600.png"

R = [
    ("r1", "🐟", "Zalm uit de oven met krieltjes en broccoli", 30, 14.20, "zalm −35%"),
    ("r2", "🍗", "Kip-kerrie met rijst en sperziebonen", 25, 9.80, "kipdij 2e halve prijs"),
    ("r3", "🥩", "Gehaktballetjes in tomatensaus met puree", 30, 8.90, None),
    ("r4", "🍝", "Pasta pesto met kip en cherrytomaatjes", 20, 7.60, "pesto 1+1"),
    ("r5", "🍝", "Macaroni met ham en kaas", 25, 6.40, None),
    ("r6", "🥔", "Boerenkoolstamppot met rookworst", 30, 7.10, "boerenkool −25%"),
    ("r7", "🍛", "Nasi met satésaus en komkommer", 25, 8.30, None),
    ("r8", "🌮", "Wraps met kip, paprika en maïs", 20, 9.20, "wraps 2 voor €3"),
    ("r9", "🍳", "Shakshuka met brood", 25, 6.10, None),
]
STEPS = [{"text": "Verwarm de oven voor op 200 °C."}, {"text": "Snijd de krieltjes doormidden en meng met olie, peper en zout."},
         {"text": "Bak de krieltjes 15 minuten in de oven.", "timer_sec": 900},
         {"text": "Leg de zalm erbij en bak nog 12 minuten.", "timer_sec": 720}, {"text": "Kook de broccoli 5 minuten en serveer."}]

plan = {
    "week": "2026-W48", "delivery": "zo 22 nov 12:00", "order_deadline": "za 21 nov 13:00",
    "advice": "Zalm is deze week 35% goedkoper; daarom twee visopties.",
    "recipes": [{"id": i, "emoji": e, "title": t, "minutes": m, "price": p, "why": w, "servings": "2 volw. + Kai",
                 "ingredients": ["2 zalmfilets", "500 g krieltjes", "1 broccoli"], "pantry": ["olijfolie", "peper", "zout"],
                 "steps": STEPS, "tips": {"michelle": "Zalm door en door gaar.", "kai": "Graatjes checken, kleine stukjes."}}
                for i, e, t, m, p, w in R],
    "days": [
        {"day": "ma", "date": "2026-11-23", "slot": "AGV", "options": ["r1", "r3"], "choice": None},
        {"day": "di", "date": "2026-11-24", "slot": "Pasta", "options": ["r4", "r5"], "choice": None, "note": "Vaak bij opa en oma"},
        {"day": "wo", "date": "2026-11-25", "slot": "Stamppot of rijst", "options": ["r6", "r7"], "choice": None},
        {"day": "do", "date": "2026-11-26", "slot": "Vrije keus", "options": ["r2", "r8"], "choice": None},
        {"day": "vr", "date": "2026-11-27", "slot": "Makkelijk", "options": ["r9"], "choice": None},
    ],
    "items": [
        {"name": "Halfvolle melk 1 liter", "picnic_id": "s1", "qty": 2, "unit_price": 1.19, "source": "standard", "unit": "1 liter"},
        {"name": "Volkoren brood", "picnic_id": "s2", "qty": 1, "unit_price": 2.39, "source": "standard"},
        {"name": "Bananen", "picnic_id": "s3", "qty": 1, "unit_price": 1.69, "source": "standard", "unit": "1 kilo"},
        {"name": "Griekse yoghurt", "picnic_id": "s4", "qty": 2, "unit_price": 1.89, "source": "promo", "promo": {"label": "2e halve prijs", "saving": 0.95}},
        {"name": "Vuilniszakken", "picnic_id": "s5", "qty": 1, "unit_price": 2.49, "source": "advice", "note": "laatst 6 weken geleden"},
        {"name": "Bakpapier", "qty": 1, "source": "extra"},
        {"name": "Zalmfilet 2 stuks", "picnic_id": "s10", "qty": 1, "unit_price": 6.99, "source": "recipe", "recipe_id": "r1", "recipe": "🐟 Zalm", "promo": {"label": "−35%", "saving": 3.76}},
        {"name": "Krieltjes 500 g", "picnic_id": "s11", "qty": 1, "unit_price": 1.79, "source": "recipe", "recipe_id": "r1", "recipe": "🐟 Zalm"},
        {"name": "Broccoli", "picnic_id": "s12", "qty": 1, "unit_price": 1.29, "source": "recipe", "recipe_id": "r1", "recipe": "🐟 Zalm"},
        {"name": "Pesto genovese", "picnic_id": "s13", "qty": 1, "unit_price": 2.49, "source": "recipe", "recipe_id": "r4", "recipe": "🍝 Pasta pesto", "promo": {"label": "1+1 gratis", "saving": 2.49}},
        {"name": "Kipfilet 300 g", "picnic_id": "s14", "qty": 1, "unit_price": 3.99, "source": "recipe", "recipe_id": "r4", "recipe": "🍝 Pasta pesto"},
        {"name": "Kipfilet 300 g", "picnic_id": "s14", "qty": 1, "unit_price": 3.99, "source": "recipe", "recipe_id": "r8", "recipe": "🌮 Wraps"},
        {"name": "Boerenkool gesneden", "picnic_id": "s15", "qty": 1, "unit_price": 1.49, "source": "recipe", "recipe_id": "r6", "recipe": "🥔 Stamppot"},
        {"name": "Rookworst", "picnic_id": "s16", "qty": 1, "unit_price": 2.29, "source": "recipe", "recipe_id": "r6", "recipe": "🥔 Stamppot"},
        {"name": "Wraps naturel", "picnic_id": "s17", "qty": 1, "unit_price": 1.65, "source": "recipe", "recipe_id": "r8", "recipe": "🌮 Wraps"},
    ],
    "questions": [
        {"id": "kai_fruit", "who": "kai", "title": "Kai · groente of fruit", "question": "Snack voor tussendoor",
         "options": [{"id": "o1", "emoji": "🥒", "title": "Snackkomkommers"}, {"id": "o2", "emoji": "🍎", "title": "Appeltjes"}, {"id": "o3", "emoji": "🍊", "title": "Mandarijntjes", "new": True}]},
        {"id": "michelle_snack", "who": "michelle", "title": "Michelle · snack", "question": "Snack voor deze week",
         "options": [{"id": "o1", "emoji": "🍪", "title": "Sultana"}, {"id": "o2", "emoji": "🥜", "title": "Rijstwafels"}]},
    ],
}

out = {}
hass = tm.FakeHass()
m = wm.WeekmenuManager(hass)
m.import_plan(plan, [{"name": "Halfvolle melk 1 liter", "picnic_id": "s1", "qty": 2, "unit_price": 1.19}, {"name": "Volkoren brood", "picnic_id": "s2", "qty": 1, "unit_price": 2.39}])
m.choose_day("ma", "r1")
m.choose_day("di", "r4")
m.choose_day("wo", "r6")
m.answer("kai_fruit", "o2")
out["proposed"] = copy.deepcopy(m.snapshot())

m.timer_start(900, "Boerenkool · stap 3")
out["cooking"] = copy.deepcopy(m.snapshot())
m.data["timers"] = []

hass.calls.clear()
asyncio.run(m.approve())
m.data["plan"]["results"][2]["ok"] = False
m.data["plan"]["results"][2]["error"] = "Niet leverbaar"
out["approved"] = copy.deepcopy(m.snapshot())

m2 = wm.WeekmenuManager(tm.FakeHass())
out["empty"] = m2.snapshot()

for snap in out.values():
    snap["can_edit"] = True
Path(__file__).with_name("fixtures.json").write_text(json.dumps(out, ensure_ascii=False, indent=1, default=str))
print("ok", {k: (v["view"] or {}).get("summary") for k, v in out.items()}["proposed"])
