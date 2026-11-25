# Weekmenu voor Home Assistant

Boodschappen (Picnic), recepten en kookmodus in één paneel in de HA-zijbalk.

- **Week:** *Vanavond* (gerecht van vandaag, direct koken), beoordelen van gisteren, keuze per dag, status met totaal en voordeel, keuze voor Michelle bij een late dienst op dinsdag, snackvragen.
- **Lijst:** producten per groep met foto, +/− en swipe om weg te halen (met Ongedaan), producten koppelen aan Picnic, goedkoper alternatief zoeken. Segment *Elke week* voor de vaste lijst.
- **Koken:** klaarzetten-checklist, één stap per scherm (swipen of tikken), timers op de server (lopen door als de app dicht is), scherm blijft aan, duim omhoog/omlaag na afloop.
- **Naar Picnic:** eerst een overzicht (aantal, totaal, open dagen, niet-gekoppelde producten), dan pas het mandje. Opnieuw akkoord geven voegt alleen het verschil toe.

## Installeren

1. HACS → ⋮ → Custom repositories → `https://github.com/rubenhartong/ha-weekmenu` (type: Integration).
2. Download *Weekmenu*, herstart Home Assistant.
3. Instellingen → Apparaten & diensten → Integratie toevoegen → *Weekmenu*.

## Services

| Service | Doel |
|---|---|
| `weekmenu.import_plan` | Nieuw weekvoorstel (door Claude op vrijdag) |
| `weekmenu.get_context` | Alle gegevens ophalen (voorkeuren, vaste lijst, feedback, plan) |
| `weekmenu.approve` | Mandje vullen met wat er nog niet in staat. Met open dagen gebeurt er niets (`blocked`), tenzij `allow_open_days: true` |
| `weekmenu.add_text` | Producten toevoegen: `"hagelslag, 2x komkommer"` |
| `weekmenu.michelle_choose` | Michelles meeneem-keuze |
| (paneel) zoeken | Voorstellen bij typen: bekende producten + Picnic-zoekresultaten (websocket `weekmenu/search`, `weekmenu/add_item`, `weekmenu/answer_item`) |
| `weekmenu.choose_day` | Keuze per dag: `{day: "ma", choice: "r2" \| "none" \| null}` |
| `weekmenu.set_preferences` | Voorkeuren bijwerken |

Bij akkoord vuurt het event `weekmenu_approved` (`added`, `failed`, `total`, `failures`, `to_remove`, `days_open`).

## Sensoren

| Entity | Inhoud |
|---|---|
| `sensor.weekmenu_status` | `none` / `proposed` / `approving` / `approved`; attributen o.a. `days_open`, `to_send`, `failed` |
| `sensor.weekmenu_totaal` | Totaal in euro; `unknown_prices`, `savings` |
| `sensor.weekmenu_besteldeadline` | Tijdstip (voor automations: "3 uur voor de deadline") |
| `sensor.weekmenu_bezorging` | Tijdstip van de bezorging |
| `sensor.weekmenu_vanavond` | Gekozen gerecht van vandaag, `Niets koken` of `Nog niet gekozen` |

## Akkoord en het Picnic-mandje

De integratie onthoudt per product wat al naar Picnic is gestuurd (`plan.sent`). Na *Aanpassen* en opnieuw
akkoord gaat alleen het verschil erheen. Wat niet meer nodig is maar al in het mandje staat, staat in `to_remove`
(Home Assistant kan niets uit het Picnic-mandje halen; dat doe je in de app). Lukt er niets, dan blijft de status
`proposed`. Twee keer tegelijk akkoord geven kan niet.

## Planformaat (`import_plan`)

Het plan wordt gecontroleerd; een fout noemt de plek, bijvoorbeeld `items[3].qty: verwacht een heel getal` of
`items[7].recipe_id: recept r19 bestaat niet`. Tijden mogen als ISO (`delivery_at`, `order_deadline_at`) of als tekst
(`delivery: "zo 6 dec 12:00"`).

```yaml
plan:
  week: "2026-W49"
  delivery: "zo 6 dec 12:00"
  order_deadline: "za 5 dec 13:00"
  advice: "Zalm is deze week 35% goedkoper."
  recipes:
    - id: r1
      emoji: "🐟"
      image_url: "https://…"   # optioneel: foto van het gerecht (bijv. van een Picnic-recept)
      image_id: null          # of een Picnic-afbeelding-id
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
      bulk: null         # optioneel bij recept-ingrediënten: grotere verpakking, zie hieronder
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
- Grote verpakking: een recept-item kan `bulk: {name, picnic_id, unit_price, replaces}` hebben
  (`replaces` = hoeveel kleine verpakkingen één grote vervangt). Is het product nodig in meerdere
  gekozen recepten en is de grote verpakking dan goedkoper, dan toont de lijst (en het mandje)
  de grote verpakking met de besparing als 💡-notitie. +/− op die regel telt in grote pakken.
- Prijscheck: knop *💶 Prijzen checken* in Lijst → Deze week. Zoekt per product op Picnic naar een
  gelijkwaardig product dat goedkoper uitvalt voor dezelfde hoeveelheid (prijs per kg/liter/stuk,
  ook een grotere verpakking). Je vinkt zelf aan wat je doorvoert. Websocket: `weekmenu/price_check`
  en `weekmenu/apply_prices` (`changes: [{key, alt}]`). Bij recept-ingrediënten wordt de vervanging
  onthouden (`plan.swaps`), zodat de hoeveelheid de dagkeuzes blijft volgen.
- Andere gerechten: aan het eind van de rij opties per dag staat een tegel *Andere gerechten*
  (met optionele wens). Die start via een API-trigger een Claude-taak die 2–3 nieuwe opties voor
  die dag bedenkt en toevoegt met `weekmenu.add_options` (`day`, `recipes`, `items`, `week`).
  Eenmalig instellen: claude.ai/code/routines → taak → Bewerken → Trigger + → API → Fire URL en
  token kopiëren → Instellingen → Apparaten & diensten → Weekmenu → Configureren.
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

## Ontwikkelen

- Paneel: `frontend/src` (Lit). Bouwen: `cd frontend && npm install && npm run build` (schrijft
  `custom_components/weekmenu/frontend/weekmenu-panel.js`, die wordt meegecommit).
- Kleuren, tekstmaten, afstanden: `frontend/src/tokens.js`. `npm test` controleert het contrast (WCAG AA) in licht en donker.
- Schermafbeeldingen (telefoon en desktop, licht en donker): `npm run shots`.
- Python: `pytest tests` (logica, zonder HA) en `WEEKMENU_HA=1 pytest tests/ha` (tegen echte Home Assistant;
  `pip install pytest-homeassistant-custom-component`). Niet in één run combineren.
