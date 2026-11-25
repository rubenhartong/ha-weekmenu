import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { I, icon } from "../icons.js";
import { DISH, addDays, cap, dayName, dayNum, eur, isoDay, plural } from "../format.js";
import { searchField } from "./parts.js";

const WHO = { kai: "K", michelle: "M", ruben: "R" };

export function weekView(p) {
  const plan = p.plan;
  if (!plan) {
    return html`<div class="empty">${icon(I.week)}<p>Nog geen weekvoorstel. Vrijdagochtend staat het klaar.</p></div>`;
  }
  const meFirst = p.userName.includes("michelle");
  const personal = [michelleCard(p), questionsCard(p, meFirst)];
  const left = html`
    ${tonightCard(p)}
    ${rateYesterday(p)}
    ${meFirst ? personal : nothing}
    ${p.days ? daysSection(p) : recipesSection(p)}`;
  const right = html`${statusCard(p)}${meFirst ? nothing : personal}`;
  return html`<div class="weekgrid"><div>${left}</div><div>${right}</div></div>`;
}

// ---------- tonight & yesterday ----------
function todayDay(p, offset = 0) {
  const iso = addDays(isoDay(), offset);
  return (p.days || []).find((d) => d.date === iso) || null;
}

function photo(r, cls = "") {
  const src = DISH(r);
  return src
    ? html`<img class=${cls} loading="lazy" referrerpolicy="no-referrer" src=${src} alt="" @error=${(e) => e.target.remove()}>`
    : html`<span aria-hidden="true">${r.emoji || "🍽️"}</span>`;
}

function tonightCard(p) {
  const d = todayDay(p);
  const r = d?.choice && d.choice !== "none" ? p.recipe(d.choice) : null;
  if (!r) return nothing;
  const src = DISH(r);
  return html`<section class="card tonight section" aria-label="Vanavond">
    ${src ? html`<div class="photo">${photo(r)}</div>` : nothing}
    <div class="body">
      <div class="row" style="align-items:flex-start">${src ? nothing : html`<div class="oemoji" style="background:var(--wm-surface2)" aria-hidden="true">${r.emoji || "🍽️"}</div>`}
        <div class="grow"><div class="eyebrow">Vanavond</div><h3>${r.title}</h3>
        <div class="ometa">${r.minutes ? html`<span>${r.minutes} min</span>` : nothing}${(r.steps || []).length ? html`<span>${plural(r.steps.length, "stap", "stappen")}</span>` : nothing}</div></div></div>
      <button class="btn" @click=${() => p.openCook(r.id)}>${icon(I.cook)}Start koken</button>
    </div></section>`;
}

function rateYesterday(p) {
  const d = todayDay(p, -1);
  const r = d?.choice && d.choice !== "none" ? p.recipe(d.choice) : null;
  if (!r || r.rating || !p.canEdit) return nothing;
  return html`<section class="card section stack" aria-label="Beoordeel gisteren">
    <div><div class="eyebrow">Gisteren</div><div style="font-weight:500">Hoe was ${r.title.toLowerCase()}?</div></div>
    <div class="rate">
      <button aria-pressed="false" @click=${() => p.rate(r.id, 1)}>${icon(I.up)}Lekker</button>
      <button aria-pressed="false" @click=${() => p.rate(r.id, -1)}>${icon(I.down)}Niet weer</button>
    </div></section>`;
}

// ---------- status ----------
function statusCard(p) {
  const plan = p.plan;
  const sm = p.summary;
  const st = p.status();
  const fails = (plan.results || []).filter((r) => !r.ok);
  const toRemove = plan.status === "approved" ? plan.to_remove || [] : [];
  const open = sm.days_open || [];
  const facts = [plural(sm.items_count || 0, "product", "producten")];
  if (sm.savings > 0) facts.push(html`<span class="save">${eur(sm.savings)} voordeel</span>`);
  if (sm.unknown_prices) facts.push(`${sm.unknown_prices} zonder prijs`);
  return html`<section class="card status stack" aria-label="Status">
    <div class="row"><span class="tag ${st.tag}">${plan.status === "approved" ? icon(I.check, "sm") : nothing}${st.label}</span>
      <span class="muted xs grow">${p.deliveryLine()}</span></div>
    <div><div class="total">${eur(sm.items_total)}${sm.unknown_prices ? html`<span class="muted" style="font-size:var(--wm-fs-md);font-weight:400"> + ?</span>` : nothing}</div>
      <div class="facts">${facts.map((f) => html`<span>${f}</span>`)}</div></div>
    ${plan.advice ? html`<div class="note">${icon(I.tip, "sm")}<span>${plan.advice}</span></div>` : nothing}
    ${plan.status === "proposed" && open.length && p.canEdit
      ? html`<div class="note attention">${icon(I.alert, "sm")}<span>${plural(open.length, "dag", "dagen")} nog niet gekozen (${open.map(dayName).join(", ")}). Zonder keuze kook je die dag niet.</span></div>`
      : nothing}
    ${fails.length ? html`<div class="note danger">${icon(I.alert, "sm")}<div>${plural(fails.length, "product", "producten")} niet in je mandje gezet:
        <ul>${fails.map((f) => html`<li>${f.name}</li>`)}</ul></div></div>` : nothing}
    ${toRemove.length ? html`<div class="note attention">${icon(I.info, "sm")}<div>Haal zelf weg in de Picnic-app:
        <ul>${toRemove.map((r) => html`<li>${r.qty}× ${r.name}</li>`)}</ul></div></div>` : nothing}
    ${plan.status === "approved" && p.canEdit
      ? html`<div class="actions">
          ${fails.length ? html`<button class="btn" @click=${() => p.approve()}>${icon(I.refresh)}Opnieuw proberen</button>` : nothing}
          <button class="btn plain" @click=${() => p.reopen()}>Aanpassen</button></div>`
      : plan.status === "proposed"
        ? html`<div class="actions"><button class="btn plain" @click=${() => p.setUi({ tab: "list" })}>${icon(I.cart)}Bekijk lijst</button></div>`
        : nothing}
  </section>`;
}

// ---------- days ----------
function daysSection(p) {
  const days = p.days;
  const chosen = days.filter((d) => d.choice).length;
  const price = days.reduce((t, d) => t + (d.choice && d.choice !== "none" ? Number(p.recipe(d.choice)?.price || 0) : 0), 0);
  return html`<section class="section" aria-label="Deze week">
    <div class="sh"><h2>Deze week</h2><span class="meta">${chosen}/${days.length} gekozen${price ? ` · ca. ${eur(price)}` : ""}</span></div>
    <div class="prog" aria-hidden="true">${days.map((d) => html`<i class=${d.choice === "none" ? "none" : d.choice ? "on" : ""}></i>`)}</div>
    <div class="days">${repeat(days, (d) => d.day, (d) => dayRow(p, d))}</div>
  </section>`;
}

function dayRow(p, d) {
  const today = isoDay();
  const open = p.ui.openDay === d.day;
  const r = d.choice && d.choice !== "none" ? p.recipe(d.choice) : null;
  const cls = ["day", open ? "open" : "", d.date === today ? "today" : "", d.date && d.date < today ? "past" : ""].join(" ");
  const main = r
    ? html`<div class="dmain">${DISH(r) ? html`<img class="dthumb" loading="lazy" referrerpolicy="no-referrer" src=${DISH(r)} alt="" @error=${(e) => e.target.remove()}>` : nothing}<span class="tt">${r.title}</span></div>`
    : d.choice === "none"
      ? html`<div class="dmain none"><span class="tt">Niets koken</span></div>`
      : html`<div class="dmain open"><span class="tt">Nog kiezen</span></div>`;
  const toggle = () => {
    p.setUi({ openDay: open ? null : d.day, jump: !open });
  };
  return html`<div class=${cls}>
    <button class="dhead" aria-expanded=${open} @click=${toggle}>
      <div class="dtile" aria-hidden="true"><small>${d.day}</small><b>${dayNum(d.date)}</b></div>
      <div class="dmid"><span class="vh">${cap(dayName(d.day))}</span>${d.slot ? html`<div class="dslot">${d.slot}</div>` : nothing}${main}${d.note ? html`<div class="dnote">${d.note}</div>` : nothing}</div>
      <div class="dright">${r?.price != null ? eur(r.price) : nothing}<span class="chev">${icon(I.chevron)}</span></div>
    </button>
    ${open ? dayBody(p, d) : nothing}
  </div>`;
}

function dayBody(p, d) {
  const cards = [
    ...(d.options || []).map((id) => p.recipe(id)).filter(Boolean).map((r) => ({ key: r.id, t: optionCard(p, d, r) })),
    ...(p.locked ? [] : [{ key: "_more", t: moreCard(p, d) }]),
    { key: "_none", t: noneCard(p, d) },
  ];
  const chosenIdx = d.choice === "none" ? cards.length - 1 : Math.max(0, cards.findIndex((c) => c.key === d.choice));
  const onScroll = (e) => dots(e.target);
  return html`<div class="dbody">
    <div class="strip" data-day=${d.day} data-jump=${p.ui.jump ? chosenIdx : ""} @scroll=${onScroll}>${repeat(cards, (c) => c.key, (c) => c.t)}</div>
    <div class="sdots" aria-hidden="true">${cards.map((c, k) => html`<i class=${k === chosenIdx ? "on" : ""}></i>`)}</div>
  </div>`;
}

/** Update the dots under an option strip while swiping (no re-render needed). */
export function dots(strip) {
  const cards = strip.querySelectorAll(".ocard");
  if (!cards.length) return;
  const w = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : strip.clientWidth;
  const idx = Math.max(0, Math.min(cards.length - 1, Math.round(strip.scrollLeft / Math.max(1, w))));
  strip.nextElementSibling?.querySelectorAll("i").forEach((dot, k) => {
    dot.classList.toggle("on", k === idx);
    dot.classList.toggle("ch", k !== idx && cards[k].classList.contains("on"));
  });
}

export function recipeIngredients(p, r, max = 4) {
  const items = (p.plan?.items || []).filter((i) => i.recipe_id === r.id && i.source === "recipe");
  const rows = items.length
    ? items.map((i) => html`<li>${i.qty > 1 ? html`<span class="q">${i.qty}×</span>` : nothing}<span class="n">${i.name}</span>${i.promo?.label ? html`<span class="tag deal">${i.promo.label}</span>` : nothing}</li>`)
    : (r.ingredients || []).map((x) => html`<li><span class="n">${typeof x === "string" ? x : x.text || x.name}</span></li>`);
  const extra = rows.length - max;
  return extra > 1 ? [...rows.slice(0, max), html`<li class="more">+ ${extra} meer</li>`] : rows;
}

function optionCard(p, d, r) {
  const on = d.choice === r.id;
  const takenOn = !on && (p.days || []).find((x) => x.choice === r.id);
  const meta = [r.minutes ? `${r.minutes} min` : "", r.price != null ? eur(r.price) : "", takenOn ? `nu op ${dayName(takenOn.day)}` : ""].filter(Boolean);
  const img = DISH(r);
  const hasPrep = (r.steps || []).length || r.tips?.michelle || r.tips?.kai;
  return html`<article class="ocard ${on ? "on" : ""}" aria-label=${r.title}>
    ${img ? html`<div class="photo"><img loading="lazy" referrerpolicy="no-referrer" src=${img} alt="" @error=${(e) => e.target.parentElement.remove()}></div>` : nothing}
    ${on ? html`<span class="chosen">${icon(I.check, "sm")}Gekozen</span>` : nothing}
    <div class="in">
      <div class="ohead">${img ? nothing : html`<div class="oemoji" aria-hidden="true">${r.emoji || "🍽️"}</div>`}
        <div><div class="otitle">${r.title}</div><div class="ometa">${meta.map((m) => html`<span>${m}</span>`)}</div></div></div>
      ${r.why ? html`<div><span class="tag deal">${r.why}</span></div>` : nothing}
      <ul class="ings">${recipeIngredients(p, r, 4)}</ul>
      <div class="ofoot">
        ${hasPrep ? html`<button class="link" @click=${() => p.setUi({ sheet: { type: "prep", day: d.day, rid: r.id } })}>Bereiding bekijken${icon(I.chevron, "sm")}</button>` : nothing}
        ${p.locked ? nothing : html`<button class="btn sm" @click=${() => p.choose(d.day, r.id)}>${on ? html`${icon(I.check, "sm")}Gekozen voor ${dayName(d.day)}` : "Kies dit"}</button>`}
      </div>
    </div></article>`;
}

function moreCard(p, d) {
  const state = p.pending(d);
  if (state === "busy") {
    return html`<article class="ocard more"><div class="in">
      <div class="ohead"><div class="oemoji">${icon(I.loading, "lg spin")}</div>
        <div><div class="otitle">Claude zoekt nieuwe gerechten…</div>
        <div class="ometa"><span>Over 5–10 minuten staan ze hier${d.pending?.wish ? ` · “${d.pending.wish}”` : ""}</span></div></div></div>
      <div class="muted sm">Je kunt de app gewoon sluiten.</div></div></article>`;
  }
  const ready = p.data?.claude_ready;
  return html`<article class="ocard more"><div class="in">
    <div class="ohead"><div class="oemoji">${icon(I.refresh, "lg")}</div>
      <div><div class="otitle">Andere gerechten</div><div class="ometa"><span>Claude bedenkt 2–3 nieuwe opties voor ${dayName(d.day)}</span></div></div></div>
    ${state === "expired" ? html`<div class="note attention">${icon(I.alert, "sm")}<span>Er kwamen geen nieuwe gerechten terug. Probeer het opnieuw.</span></div>` : nothing}
    <input class="input plain" id="wish-${d.day}" placeholder="Wens? Bijv. iets met vis" enterkeyhint="send" autocomplete="off" maxlength="200"
      @keydown=${(e) => e.key === "Enter" && p.requestRecipes(d.day)}>
    ${ready ? nothing : html`<div class="muted xs">Eerst eenmalig instellen: Instellingen → Apparaten &amp; diensten → Weekmenu → Configureren.</div>`}
    <div class="ofoot"><button class="btn sm tonal" ?disabled=${!ready} @click=${() => p.requestRecipes(d.day)}>Vraag Claude</button></div>
  </div></article>`;
}

function noneCard(p, d) {
  const on = d.choice === "none";
  return html`<article class="ocard ${on ? "on" : ""}" aria-label="Niets koken"><div class="in">
    <div class="ohead"><div class="oemoji">${icon(I.none, "lg")}</div>
      <div><div class="otitle">Niets koken</div><div class="ometa"><span>Uit eten, restjes of bij opa en oma</span></div></div></div>
    <div class="ofoot">${p.locked ? nothing : html`<button class="btn sm" @click=${() => p.choose(d.day, "none")}>${on ? html`${icon(I.check, "sm")}Gekozen voor ${dayName(d.day)}` : "Kies dit"}</button>`}</div>
  </div></article>`;
}

// plan without days (old format): the recipes as a list
function recipesSection(p) {
  const recipes = p.plan.recipes || [];
  return html`<section class="section"><div class="sh"><h2>Recepten deze week</h2></div>
    ${recipes.length ? html`<div class="pick">${recipes.map((r) => html`<button @click=${() => p.openCook(r.id)}>
        <span class="pthumb">${photo(r)}</span><span class="grow"><b style="font-weight:500">${r.title}</b><br><span class="muted sm">${r.minutes ? `${r.minutes} min` : ""}</span></span>${icon(I.chevron)}</button>`)}</div>`
      : html`<div class="card muted">Geen recepten deze week.</div>`}</section>`;
}

// ---------- michelle & questions ----------
function michelleCard(p) {
  const m = p.plan?.michelle;
  if (!m || !(m.options || []).length) return nothing;
  return html`<section class="section"><div class="sh"><h2>Michelle ${m.day_label || ""}</h2></div>
    <div class="card"><div>${m.question || "Late dienst — wat neem je mee?"}</div>
      <div class="opts">${m.options.map((o) => html`
        <button class="opt" aria-pressed=${m.choice === o.id} ?disabled=${p.locked}
          @click=${() => p.ws({ type: "weekmenu/michelle_choose", option_id: m.choice === o.id ? null : o.id })}>
          <span class="e" aria-hidden="true">${o.emoji || "🥗"}</span><span class="n">${o.title}</span>
          <span class="muted sm num">${o.price ? eur(o.price) : ""}</span>${m.choice === o.id ? icon(I.check) : nothing}</button>`)}
      </div>
      ${m.choice ? nothing : html`<div class="muted sm" style="margin-top:8px">Michelle kiest zelf</div>`}
    </div></section>`;
}

function questionsCard(p, meFirst) {
  let qs = p.plan?.questions || [];
  if (!qs.length) return nothing;
  if (meFirst) qs = [...qs].sort((a, b) => (b.who === "michelle") - (a.who === "michelle"));
  return html`<section class="section"><div class="sh"><h2>Snacks deze week</h2></div><div class="card">${qs.map((q) => html`
    <div class="q">
      <div class="qt"><span class="who" aria-hidden="true">${WHO[q.who] || "?"}</span><span class="grow">${q.title}${q.question ? html` <span class="sub">${q.question}</span>` : nothing}</span></div>
      <div class="chips">${(q.options || []).map((o) => html`
        <button class="chip" aria-pressed=${q.choice === o.id} ?disabled=${p.locked}
          @click=${() => p.ws({ type: "weekmenu/answer", question_id: q.id, option_id: q.choice === o.id ? null : o.id })}>
          ${o.emoji ? html`<span aria-hidden="true">${o.emoji}</span>` : nothing}${o.title}${o.new && !o.learned ? html`<span class="new">nieuw</span>` : nothing}</button>`)}
        ${q.choice === "custom" ? html`<button class="chip" aria-pressed="true" ?disabled=${p.locked}
          @click=${() => p.ws({ type: "weekmenu/answer", question_id: q.id, option_id: null })}>${q.custom}</button>` : nothing}
      </div>
      ${p.locked ? nothing : html`<div style="margin-top:12px">${searchField(p, `own-${q.id}`, "Iets anders zoeken")}</div>`}
    </div>`)}</div></section>`;
}
