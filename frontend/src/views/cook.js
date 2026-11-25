import { html, nothing } from "lit";
import { I, icon } from "../icons.js";
import { DISH, cap, dayName, isoDay, mmss, plural, timerFromText } from "../format.js";

function chosenRecipes(p) {
  if (!p.days) return (p.plan?.recipes || []).map((r) => ({ r, day: null, date: null }));
  return p.days
    .filter((d) => d.choice && d.choice !== "none")
    .map((d) => ({ r: p.recipe(d.choice), day: d.day, date: d.date }))
    .filter((x) => x.r);
}

export function cookPick(p) {
  const list = chosenRecipes(p);
  if (!list.length) {
    return html`<div class="empty">${icon(I.cook)}<p>${p.days ? "Nog geen gerechten gekozen. Kies per dag in het tabblad Week." : "Nog geen recepten deze week."}</p>
      ${p.days ? html`<button class="btn tonal" @click=${() => p.setUi({ tab: "week" })}>Naar Week</button>` : nothing}</div>`;
  }
  const today = isoDay();
  return html`${timersBar(p)}<div class="sh" style="margin-top:4px"><h2>Wat gaan we koken?</h2></div>
    <div class="pick">${list.map(({ r, day, date }) => {
      const src = DISH(r);
      const now = date === today;
      return html`<button class=${now ? "now" : ""} @click=${() => p.openCook(r.id)}>
        <span class="pthumb">${src ? html`<img loading="lazy" referrerpolicy="no-referrer" src=${src} alt="" @error=${(e) => e.target.remove()}>` : html`<span aria-hidden="true">${r.emoji || "🍽️"}</span>`}</span>
        <span class="grow">${day ? html`<span class="muted xs">${now ? "Vanavond" : cap(dayName(day))}</span><br>` : nothing}<span style="font-weight:500">${r.title}</span><br>
          <span class="muted sm">${[r.minutes ? `${r.minutes} min` : "", plural((r.steps || []).length, "stap", "stappen")].filter(Boolean).join(" · ")}</span></span>
        ${r.rating ? icon(r.rating > 0 ? I.up : I.down, "", r.rating > 0 ? "Lekker gevonden" : "Niet weer") : nothing}${icon(I.chevron)}</button>`;
    })}</div>`;
}

function timersBar(p) {
  const timers = p.data?.timers || [];
  if (!timers.length) return nothing;
  return html`<div class="timers" style="margin-bottom:16px" role="status">${timers.map((t) => timerChip(p, t))}</div>`;
}

function timerChip(p, t) {
  const left = Math.max(0, Math.round((Date.parse(t.end) - p.now) / 1000));
  const done = t.done || left === 0;
  return html`<button class="tchip ${done ? "done" : ""}" aria-label="${t.label}: ${done ? "klaar" : mmss(left)}. Tik om te stoppen" @click=${() => p.stopTimer(t.id)}>
    ${icon(I.timer, "sm")}${t.label} ${done ? "klaar!" : mmss(left)}${icon(I.close, "sm")}</button>`;
}

export function cookView(p) {
  const c = p.ui.cook;
  const r = p.recipe(c.rid);
  if (!r) return nothing;
  const steps = r.steps || [];
  const n = steps.length;
  const i = c.step; // -1 = klaarzetten, n = klaar
  const ings = r.ingredients || [];
  const toggle = (k) => p.setUi({ cook: { ...c, checked: { ...c.checked, [k]: !c.checked[k] } } });
  const ingList = html`<ul class="ing">${ings.map((x, k) => html`<li><button role="checkbox" aria-checked=${!!c.checked[k]} @click=${() => toggle(k)}>
      <span class="box">${c.checked[k] ? icon(I.check, "sm") : nothing}</span>${typeof x === "string" ? x : x.text || x.name}</button></li>`)}</ul>`;
  let content;
  let side = null;
  if (i < 0) {
    content = html`<div class="stepno">Klaarzetten</div>
      <div style="font-size:var(--wm-fs-lg);font-weight:500">${r.servings || "2 volw. + Kai"}${r.minutes ? ` · ${r.minutes} min` : ""}</div>
      ${ingList}
      ${(r.pantry || []).length ? html`<div class="muted">Uit de kast: ${r.pantry.join(", ")}</div>` : nothing}`;
  } else if (i >= n) {
    content = html`<div class="stepno">Klaar</div><div class="txt">Eet smakelijk!</div>
      <div class="muted">Hoe was het?</div>
      <div class="rate">
        <button aria-pressed=${r.rating > 0} @click=${() => p.rate(r.id, 1)}>${icon(I.up)}Lekker</button>
        <button aria-pressed=${r.rating < 0} @click=${() => p.rate(r.id, -1)}>${icon(I.down)}Niet weer</button></div>`;
  } else {
    const s = steps[i];
    const tsec = timerFromText(s);
    const tips = [];
    if (i === 0 && r.tips?.kai) tips.push(html`<b>Kai</b> · ${r.tips.kai}`);
    if (i === n - 1 && r.tips?.michelle) tips.push(html`<b>Michelle</b> · ${r.tips.michelle}`);
    if (s.tip) tips.push(s.tip);
    const label = `${r.title.split(" ").slice(0, 2).join(" ")} · stap ${i + 1}`;
    content = html`<div class="stepno">Stap ${i + 1} van ${n}</div>
      <div class="txt">${s.text}</div>
      ${tips.map((t) => html`<div class="note">${icon(I.tip, "sm")}<span>${t}</span></div>`)}
      ${tsec ? html`<div><button class="btn tonal" @click=${() => p.startTimer(tsec, label)}>${icon(I.timer)}Timer ${Math.round(tsec / 60)} min</button></div>` : nothing}`;
    side = html`<div class="stepno" style="margin-bottom:8px">Ingrediënten</div>${ingList}`;
  }
  const timers = p.data?.timers || [];
  return html`<div class="cook" role="dialog" aria-modal="true" aria-label="Koken: ${r.title}">
    <div class="top"><span class="t">${r.title}</span><button class="iconbtn" aria-label="Sluiten" @click=${() => p.closeCook()}>${icon(I.close)}</button></div>
    <div class="stage ${side ? "split" : ""}"
      @touchstart=${(e) => { p._cx = e.touches[0].clientX; p._cy = e.touches[0].clientY; }}
      @touchend=${(e) => {
        if (p._cx == null) return;
        const dx = e.changedTouches[0].clientX - p._cx, dy = e.changedTouches[0].clientY - p._cy;
        p._cx = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) p.cookStep(dx < 0 ? 1 : -1);
      }}>
      ${side ? html`<div class="side">${side}</div>` : nothing}
      <div class="main">${content}${timers.length ? html`<div class="timers" role="status">${timers.map((t) => timerChip(p, t))}</div>` : nothing}</div>
      ${i >= 0 && i < n ? html`<button class="tap l" aria-label="Vorige stap" @click=${() => p.cookStep(-1)}></button><button class="tap r" aria-label="Volgende stap" @click=${() => p.cookStep(1)}></button>` : nothing}
    </div>
    <div class="bottom">
      <button class="nav" aria-label="Vorige" ?disabled=${i < 0} @click=${() => p.cookStep(-1)}>${icon(I.back)}</button>
      <div class="dots" aria-hidden="true">${[-1, ...steps.map((_, k) => k)].map((k) => html`<i class=${k === i ? "on" : ""}></i>`)}</div>
      ${i >= n
        ? html`<button class="nav p" aria-label="Klaar" @click=${() => p.closeCook()}>${icon(I.check)}</button>`
        : html`<button class="nav p" aria-label="Volgende" @click=${() => p.cookStep(1)}>${icon(I.next)}</button>`}
    </div></div>`;
}
