import { html, nothing } from "lit";
import { I, icon } from "../icons.js";
import { IMG, eur } from "../format.js";

export function thumb(i) {
  return html`<div class="thumb">${i.image_id
    ? html`<img loading="lazy" src=${IMG(i.image_id)} alt="" @error=${(e) => e.target.remove()}>`
    : icon(I.basket)}</div>`;
}

/** Search box with Picnic suggestions; Enter picks the first linked product. */
export function searchField(p, field, placeholder) {
  const sg = p.sugg[field];
  return html`<div class="field" role="search">
    ${icon(I.search)}
    <input class="input" id=${field} placeholder=${placeholder} enterkeyhint="search" autocomplete="off" aria-label=${placeholder}
      aria-controls="${field}-sugg" aria-expanded=${!!sg}
      @input=${(e) => p.onSearch(field, e.target.value)}
      @keydown=${(e) => { if (e.key === "Enter") p.searchEnter(field); if (e.key === "Escape") p.clearSearch(field); }}>
  </div>
  ${sg ? html`<div class="sugg" id="${field}-sugg" role="listbox">
    ${sg.loading && !sg.items.length ? html`<div class="hint">Zoeken…</div>` : nothing}
    ${!sg.loading && !sg.items.length
      ? html`<div class="hint">${field === "link" ? "Niets gevonden. Probeer een ander woord." : html`Niets gevonden bij Picnic. Druk op Enter om “${sg.q}” als losse tekst toe te voegen.`}</div>`
      : nothing}
    ${sg.items.map((it) => html`<button role="option" @click=${() => p.pick(field, it)}>
      ${thumb(it)}<span class="grow"><span style="display:block;font-weight:500">${it.name}</span>
      <span class="muted xs">${[it.unit, it.unit_price != null ? eur(it.unit_price) : "", it.bron === "bekend" ? "eerder gekocht" : ""].filter(Boolean).join(" · ")}</span></span>
      <span class="plus">${icon(field === "link" ? I.link : I.plus)}</span></button>`)}
  </div>` : nothing}`;
}

/** Swipe a row to the left to remove it (touch); the minus button does the same without swiping. */
export function swipe(onRemove) {
  let x0 = null, y0 = null, dx = 0, axis = null;
  return {
    start: (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; axis = null; },
    move: (e) => {
      if (x0 == null) return;
      const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
      if (axis == null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
      if (axis !== "x") return;
      dx = Math.min(0, mx);
      const el = e.currentTarget;
      el.classList.add("dragging"); el.parentElement.classList.add("drag");
      el.style.transform = `translateX(${dx}px)`;
    },
    end: (e) => {
      const el = e.currentTarget;
      el.classList.remove("dragging");
      if (axis === "x" && dx < -90) {
        el.style.transform = "translateX(-110%)";
        setTimeout(() => { onRemove(); el.style.transform = ""; el.parentElement?.classList.remove("drag"); }, 180);
      } else {
        el.style.transform = "";
        setTimeout(() => el.parentElement?.classList.remove("drag"), 200);
      }
      x0 = null;
    },
  };
}
