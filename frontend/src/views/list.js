import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { I, icon } from "../icons.js";
import { eur, plural } from "../format.js";
import { searchField, swipe, thumb } from "./parts.js";

const GROUPS = [
  ["recipe", "Voor je recepten"],
  ["michelle", "Voor Michelle"],
  ["snack", "Snacks"],
  ["standard", "Vaste boodschappen"],
  ["promo", "Aanbiedingen"],
  ["advice", "Misschien bijna op"],
  ["extra", "Zelf toegevoegd"],
];

export function listView(p) {
  const seg = html`<div class="seg" role="tablist">
    <button role="tab" aria-selected=${p.ui.seg === "week"} @click=${() => p.setUi({ seg: "week" })}>Deze week</button>
    <button role="tab" aria-selected=${p.ui.seg === "std"} @click=${() => p.setUi({ seg: "std" })}>Elke week</button></div>`;
  if (p.ui.seg === "std") return html`${seg}${stdView(p)}`;
  const plan = p.plan;
  if (!plan) return html`${seg}<div class="empty">${icon(I.cart)}<p>Nog geen lijst deze week.</p></div>`;
  const locked = p.locked;
  const active = p.active();
  const known = new Set(GROUPS.map(([s]) => s));
  const groups = [...GROUPS, ["_other", "Overig"]].map(([src, label]) => {
    const items = active.filter((i) => (src === "_other" ? !known.has(i.source || "extra") : (i.source || "extra") === src));
    if (!items.length) return nothing;
    const sub = items.reduce((s, i) => s + (i.unit_price || 0) * i.qty, 0);
    return html`<div class="gh"><span>${label}</span><span>${eur(sub)}</span></div>
      <div class="group">${repeat(items, (i) => i.key, (i) => row(p, i, locked))}</div>`;
  });
  const removed = p.items().filter((i) => i.removed || i.qty === 0);
  return html`${seg}
    ${locked
      ? html`<div class="note" style="margin-bottom:8px">${icon(I.info, "sm")}<span class="grow">${p.canEdit ? "Deze lijst staat in je Picnic-mandje." : "Je kunt deze lijst alleen bekijken."}</span>
          ${p.canEdit && p.plan.status === "approved" ? html`<button class="link" @click=${() => p.reopen()}>Aanpassen</button>` : nothing}</div>`
      : html`<div class="tools">${searchField(p, "addweek", "Product toevoegen")}
          <button class="btn plain sm" ?disabled=${p.ui.priceLoading} @click=${() => p.priceCheck()}>
            ${p.ui.priceLoading ? html`${icon(I.loading, "spin")}Picnic doorzoeken…` : html`${icon(I.euro)}Goedkoper alternatief zoeken`}</button></div>`}
    ${p.summary.unlinked && !locked ? html`<div class="note attention" style="margin-top:8px">${icon(I.link, "sm")}<span>${plural(p.summary.unlinked, "product is", "producten zijn")} niet gekoppeld aan Picnic. Tik op <b>Koppel</b>, anders kiest Picnic zelf een product op naam.</span></div>` : nothing}
    ${groups}
    ${removed.length && !locked ? html`<details class="removed"><summary>${icon(I.trash, "sm")}Weggehaald (${removed.length})</summary>
      <div class="group">${removed.map((i) => html`<div class="r"><span>${i.name}</span><button class="link" @click=${() => p.restore(i)}>Terugzetten</button></div>`)}</div></details>` : nothing}`;
}

function row(p, i, locked) {
  const bits = [];
  if (!i.picnic_id) bits.push(locked ? html`<span class="tag attention">Niet gekoppeld</span>` : html`<button class="tag attention" @click=${() => p.setUi({ sheet: { type: "link", key: i.key, name: i.name } })}>${icon(I.link, "sm")}Koppel</button>`);
  if (i.promo?.label) bits.push(html`<span class="tag deal">${i.promo.label}</span>`);
  if (i.recipe) bits.push(html`<span>${i.recipe}</span>`);
  if (i.note) bits.push(html`<span>${i.note}</span>`);
  if (i.unit) bits.push(html`<span>${i.unit}</span>`);
  const sw = locked ? null : swipe(() => p.remove(i));
  return html`<div class="rowwrap"><div class="behind" aria-hidden="true">${icon(I.trash)}Weg</div>
    <div class="item" @touchstart=${sw?.start} @touchmove=${sw?.move} @touchend=${sw?.end}>
      ${thumb(i)}
      <div class="info"><div class="n">${i.name}</div>${bits.length ? html`<div class="s">${bits}</div>` : nothing}</div>
      ${locked ? html`<span class="muted num">${i.qty}×</span>` : html`<div class="stepper">
        <button aria-label="Minder ${i.name}" @click=${() => p.setQty(i, i.qty - 1)}>${icon(i.qty === 1 ? I.trash : I.minus)}</button>
        <span aria-live="polite">${i.qty}</span>
        <button aria-label="Meer ${i.name}" @click=${() => p.setQty(i, i.qty + 1)}>${icon(I.plus)}</button></div>`}
      <div class="price ${i.unit_price == null ? "unknown" : ""}">${i.unit_price != null ? eur(i.unit_price * i.qty) : "?"}</div>
    </div></div>`;
}

function stdView(p) {
  const std = p.data.standard_items || [];
  return html`<div class="muted sm" style="margin:0 4px 12px">Dit komt elke week standaard op je lijst.</div>
    ${p.canEdit ? html`<div class="tools">${searchField(p, "addstd", "Vast product toevoegen")}</div>` : nothing}
    ${std.length ? html`<div class="group" style="margin-top:12px">${repeat(std, (i) => i.key, (i) => {
      const sw = p.canEdit ? swipe(() => p.stdQty(i, 0)) : null;
      return html`<div class="rowwrap"><div class="behind" aria-hidden="true">${icon(I.trash)}Weg</div>
        <div class="item" @touchstart=${sw?.start} @touchmove=${sw?.move} @touchend=${sw?.end}>
          ${thumb(i)}<div class="info"><div class="n">${i.name}</div>${i.unit ? html`<div class="s"><span>${i.unit}</span></div>` : nothing}</div>
          ${p.canEdit ? html`<div class="stepper">
            <button aria-label="Minder ${i.name}" @click=${() => p.stdQty(i, i.qty - 1)}>${icon(i.qty === 1 ? I.trash : I.minus)}</button>
            <span>${i.qty}</span>
            <button aria-label="Meer ${i.name}" @click=${() => p.stdQty(i, i.qty + 1)}>${icon(I.plus)}</button></div>` : html`<span class="muted num">${i.qty}×</span>`}
        </div></div>`;
    })}</div>` : html`<div class="empty">${icon(I.cart)}<p>Nog geen vaste producten.</p></div>`}`;
}
