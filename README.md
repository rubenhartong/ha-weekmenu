# Weekmenu voor Home Assistant

Boodschappen (Picnic), recepten en kookmodus in één paneel in de HA-zijbalk.

- **Week:** status van het weekvoorstel, totaal en voordeel, recepten als kaarten, keuze voor Michelle bij een late dienst op dinsdag.
- **Lijst:** producten per groep met foto, +/− en swipe om weg te halen (met Ongedaan). Segment *Altijd* voor de vaste lijst.
- **Koken:** klaarzetten-checklist, één stap per scherm (swipen of tikken), timers, scherm blijft aan, duim omhoog/omlaag na afloop.

## Installeren

1. HACS → ⋮ → Custom repositories → `https://github.com/rubenhartong/ha-weekmenu` (type: Integration).
2. Download *Weekmenu*, herstart Home Assistant.
3. Instellingen → Apparaten & diensten → Integratie toevoegen → *Weekmenu*.

## Services

| Service | Doel |
|---|---|
| `weekmenu.import_plan` | Nieuw weekvoorstel (door Claude op vrijdag) |
| `weekmenu.get_context` | Alle gegevens ophalen (voorkeuren, vaste lijst, feedback, plan) |
| `weekmenu.approve` | Alles in het Picnic-mandje zetten |
| `weekmenu.add_text` | Producten toevoegen: `"hagelslag, 2x komkommer"` |
| `weekmenu.michelle_choose` | Michelles meeneem-keuze |
| `weekmenu.choose_day` | Keuze per dag: `{day: "ma", choice: "r2" \| "none" \| null}` |
| `weekmenu.set_preferences` | Voorkeuren bijwerken |

Bij akkoord vuurt het event `weekmenu_approved` (`added`, `failed`, `total`).

## Planformaat (`import_plan`)

```yaml
plan:
  week: "2026-W49"
  delivery: "zo 6 dec 12:00"
  order_deadline: "za 5 dec 13:00"
  advice: "Zalm is deze week 35% goedkoper."
  recipes:
    - id: r1
      emoji: "🐟"
      title: Zalm uit de oven met krieltjes
      minutes: 30
      price: 18.77
      why: "zalm −35%"
      servings: "2 volw. + Kai"
      ingredients: ["2 zalmfilets", "500 g krieltjes"]
      pantry: ["olijfolie", "peper"]
      steps:
        - text: "Verwarm de oven voor op 200 °C."
        - text: "Bak de zalm 15 minuten."
          timer_sec: 900
      tips: { michelle: "Zalm door en door gaar.", kai: "Graatjes checken, kleine stukjes." }
  items:
    - name: "Halfvolle melk 1L"
      picnic_id: "s1001234"
      image_id: "abc123"
      qty: 2
      unit_price: 1.19
      promo: { label: "1+1 gratis", saving: 1.19 }
      source: standard   # standard | promo | recipe | extra | michelle | advice
      recipe: null
      recipe_id: null    # bij source: recipe het recept-id (r1…); nodig voor keuze per dag
  # optioneel: kiezen per dag (ma–vr). Zonder `days` werkt alles zoals voorheen.
  days:
    - { day: ma, date: "2026-11-30", slot: AGV,   options: [r1, r2, r3], choice: null }
    - { day: di, date: "2026-12-01", slot: pasta, options: [r4, r5], choice: null, note: "Michelle eet niet thuis" }
  michelle:             # alleen als ze dinsdag laat werkt
    day_label: "di 1 dec"
    question: "Late dienst — wat neem je mee?"
    options:
      - id: m1
        emoji: "🥗"
        title: "Kip-couscoussalade"
        price: 3.90
        items: [{ name: "Maaltijdsalade kip couscous", picnic_id: "s…", qty: 1, unit_price: 3.90 }]
```

### Keuze per dag

- `choice`: `null` (nog kiezen), een recept-id, of `"none"` (niets koken). Een recept kan op
  meerdere dagen als optie staan, maar maar op één dag gekozen zijn (kiezen op een andere dag
  verplaatst het). `recipe.selected` volgt de keuzes.
- Totaal, lijst en *Akkoord → Picnic-mandje* tellen alleen ingrediënten (`source: recipe` met
  `recipe_id`) van gekozen recepten. Hetzelfde product in meerdere gekozen recepten wordt één
  regel met opgetelde aantallen. Een dag zonder keuze telt bij akkoord als niets koken; het
  paneel waarschuwt ("2 dagen nog niet gekozen") en `approve` geeft `days_open` terug.
- Kookmodus toont alleen gekozen recepten, op volgorde van de dagen.
- Het paneel en `get_context` krijgen naast de opgeslagen gegevens een berekend `view`:
  `items` (wat meetelt) en `summary` (`days_chosen`, `days_total`, `days_open`, `recipe_price`,
  `items_total`).

Gegevens staan in `.storage/weekmenu` en gaan mee in de HA-backups.

## Events

- `weekmenu_plan_imported` — `week`, `recipes`, `michelle` (of `null`): voor de vraag aan Michelle.
- `weekmenu_michelle_choice` — `option_id`, `title`, `reminder` (bijv. "maaltijdsalade").
- `weekmenu_approved` — `added`, `failed`, `total`, `days_open`.
- `weekmenu_day_chosen` — `day`, `choice`, `title`, `moved_from`, `summary`.

## Weekvragen (snacks)

`plan.questions`: lijst van `{id, who: kai|michelle|ruben, title, question, options: [{id, emoji, title, price, items[]}]}`.
Beantwoorden met `weekmenu.answer` (`question_id` + `option_id`, of `text` om zelf iets te typen).
Elke keuze en elk getypt product wordt onthouden in `preferences.learned[<question_id>]` (met aantal en datum), zodat het voorstel ze de volgende keer als eerste aanbiedt.
Event: `weekmenu_answer` (`question_id`, `who`, `option_id`, `title`).

## Bijna op (huishoudspullen)

Items met `source: advice` zijn tips ("misschien bijna op") met een reden in `note`. Wegvegen, zelf toevoegen en kopen wordt gelogd in `preferences.restock_log` (`skipped` / `added` / `bought` met datum); het vrijdagvoorstel gebruikt dat samen met de Picnic-geschiedenis om het ritme per product bij te stellen.
