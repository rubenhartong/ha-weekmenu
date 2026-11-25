import { html, nothing } from "lit";
import { I, icon } from "../icons.js";
import { DISH, dayName, eur, plural } from "../format.js";
import { recipeIngredients } from "./week.js";
import { searchField } from "./parts.js";

export function sheets(p) {
  const s = p.ui.sheet;
  if (!s) return nothing;
  const close = () => p.setUi({ sheet: null });
  const body = s.type === "prep" ? prep(p, s) : s.type === "price" ? price(p, s) : s.type === "approve" ? approve(p) : s.type === "link" ? link(p, s) : nothing;
  if (body === nothing) return nothing;
  return html`<div class="scrim" @click=${close}></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1"><div class="grab"></div>${body}</div>`;
}

function prep(p, s) {
  const d = (p.days || []).find((x) => x.day === s.day);
  const r = p.recipe(s.rid);
  if (!d || !r) return nothing;
  const on = d.choice === r.id;
  const tips = [r.tips?.michelle ? html`<b>Michelle</b> · ${r.tips.michelle}` : null, r.tips?.kai ? html`<b>Kai</b> · ${r.tips.kai}` : null].filter(Boolean);
  const meta = [r.minutes ? `${r.minutes} min` : "", r.servings || "", r.price != null ? eur(r.price) : ""].filter(Boolean);
  return html`
    ${DISH(r) ? html`<div class="photo"><img referrerpolicy="no-referrer" src=${DISH(r)} alt="" @error=${(e) => e.target.parentElement.remove()}></div>` : nothing}
    <h3 id="sheet-title">${r.title}</h3>
    <div class="ometa">${meta.map((m) => html`<span>${m}</span>`)}</div>
    ${r.why ? html`<div style="margin-top:12px"><span class="tag deal">${r.why}</span></div>` : nothing}
    <div class="sec">Ingrediënten</div><ul class="ings">${recipeIngredients(p, r, 99)}</ul>
    ${(r.pantry || []).length ? html`<div class="muted sm" style="margin-top:8px">Uit de kast: ${r.pantry.join(", ")}</div>` : nothing}
    ${(r.steps || []).length ? html`<div class="sec">Bereiding</div><ol>${r.steps.map((st) => html`<li>${st.text}</li>`)}</ol>` : nothing}
    ${tips.length ? html`<div class="stack" style="margin-top:16px">${tips.map((t) => html`<div class="note">${icon(I.tip, "sm")}<span>${t}</span></div>`)}</div>` : nothing}
    <div class="acts"><button class="btn plain" @click=${() => p.setUi({ sheet: null })}>Sluiten</button>
      ${p.locked ? nothing : html`<button class="btn main" @click=${() => p.choose(d.day, r.id)}>${on ? html`${icon(I.check)}Gekozen voor ${dayName(d.day)}` : `Kies voor ${dayName(d.day)}`}</button>`}</div>`;
}

function price(p, s) {
  const { result: r, sel } = s;
  const list = r.suggestions || [];
  const chosen = list.filter((x) => sel.has(x.key));
  const save = chosen.reduce((t, x) => t + x.alt.saving, 0);
  const toggle = (key) => {
    const next = new Set(sel);
    next.has(key) ? next.delete(key) : next.add(key);
    p.setUi({ sheet: { ...s, sel: next } });
  };
  return html`<h3 id="sheet-title">Goedkoper alternatief</h3>
    ${list.length
      ? html`<p class="muted sm">${plural(r.checked, "product", "producten")} vergeleken. Vink aan wat je wilt vervangen; controleer of het echt hetzelfde product is.</p>
        <div>${list.map((x) => html`<button class="prow" role="checkbox" aria-checked=${sel.has(x.key)} @click=${() => toggle(x.key)}>
          <span class="box">${sel.has(x.key) ? icon(I.check, "sm") : nothing}</span>
          <span class="pt"><span class="was" style="display:block">${x.current.qty}× ${x.current.name}${x.current.unit && !/\d/.test(x.current.name) ? ` (${x.current.unit})` : ""} · ${eur(x.current.total)}</span>
            <span class="nu" style="display:block">${x.alt.qty}× ${x.alt.name}${x.alt.unit && !/\d/.test(x.alt.name) ? ` (${x.alt.unit})` : ""} · ${eur(x.alt.total)}</span>
            <span class="muted xs">${x.alt.reason}${x.current.recipe ? ` · ${x.current.recipe}` : ""}</span></span>
          <span class="ps">−${eur(x.alt.saving)}</span></button>`)}</div>`
      : html`<div class="empty" style="padding:24px 0">${icon(I.check)}<p>${plural(r.checked, "product", "producten")} vergeleken. Je hebt al de goedkoopste keuze.</p></div>`}
    <div class="acts"><button class="btn plain" @click=${() => p.setUi({ sheet: null })}>${list.length ? "Annuleren" : "Sluiten"}</button>
      ${list.length ? html`<button class="btn main" ?disabled=${!chosen.length} @click=${() => p.applyPrices()}>${chosen.length ? `Vervang ${chosen.length} · −${eur(save)}` : "Kies wat je vervangt"}</button>` : nothing}</div>`;
}

/** Review before anything goes to Picnic: what, how much, and what you might not expect. */
function approve(p) {
  const sm = p.summary;
  const plan = p.plan;
  const resend = Object.keys(plan.sent || {}).length > 0;
  const open = sm.days_open || [];
  const noCook = (p.days || []).filter((d) => d.choice === "none").map((d) => dayName(d.day));
  const recipes = (p.days || []).filter((d) => d.choice && d.choice !== "none").length;
  const toRemove = sm.to_remove || [];
  return html`<h3 id="sheet-title">${resend ? "Wijzigingen naar Picnic" : "Naar je Picnic-mandje"}</h3>
    <ul class="lines" style="margin-top:12px">
      <li><span>${resend ? "Nog toe te voegen" : "Producten"}</span><b>${resend ? sm.to_send : sm.items_count}</b></li>
      ${p.days ? html`<li><span>Gerechten</span><b>${recipes} van ${p.days.length} dagen</b></li>` : nothing}
      <li><span>Totaal (schatting)</span><b>${eur(sm.items_total)}${sm.unknown_prices ? " + ?" : ""}</b></li>
      ${sm.savings > 0 ? html`<li><span>Voordeel</span><b class="save">${eur(sm.savings)}</b></li>` : nothing}
    </ul>
    <div class="stack" style="margin-top:16px">
      ${open.length ? html`<div class="note attention">${icon(I.alert, "sm")}<span><b>${open.map(dayName).join(", ")}</b>: nog niet gekozen. Daarvoor gaat er niets mee.</span></div>` : nothing}
      ${noCook.length ? html`<div class="note">${icon(I.none, "sm")}<span>Niets koken op ${noCook.join(", ")}.</span></div>` : nothing}
      ${sm.unlinked ? html`<div class="note attention">${icon(I.link, "sm")}<span>${plural(sm.unlinked, "product", "producten")} niet gekoppeld: Picnic kiest zelf op naam.</span></div>` : nothing}
      ${sm.unknown_prices ? html`<div class="note">${icon(I.info, "sm")}<span>${plural(sm.unknown_prices, "product heeft", "producten hebben")} nog geen prijs; het totaal is daardoor hoger.</span></div>` : nothing}
      ${toRemove.length ? html`<div class="note attention">${icon(I.info, "sm")}<div>Al in je mandje maar niet meer nodig. Haal zelf weg in de Picnic-app:<ul>${toRemove.map((r) => html`<li>${r.qty}× ${r.name}</li>`)}</ul></div></div>` : nothing}
      <div class="muted xs">Bezorgmoment kiezen en afrekenen doe je daarna in de Picnic-app.</div>
    </div>
    <div class="acts"><button class="btn plain" @click=${() => p.setUi({ sheet: null })}>Nog niet</button>
      <button class="btn main" @click=${() => p.approve()}>${icon(I.toCart)}${resend && !sm.to_send ? "Klaar, niets nieuws" : "Zet in mandje"}</button></div>`;
}

function link(p, s) {
  return html`<h3 id="sheet-title">Koppel aan Picnic</h3>
    <p class="muted sm">Kies het product voor “${s.name}”. Dan weet je zeker wat er in je mandje komt.</p>
    ${searchField(p, "link", s.name)}
    <div class="acts"><button class="btn plain" @click=${() => p.setUi({ sheet: null })}>Annuleren</button></div>`;
}
