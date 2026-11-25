// Weekmenu panel — boodschappen, recepten en kookmodus voor Home Assistant.
// Lit web component; data via websocket "weekmenu/subscribe". Build: `npm run build` in /frontend.

import { LitElement, html, nothing } from "lit";
import { styles } from "./styles.js";
import { I, icon } from "./icons.js";
import { dayName, eur, plural, when } from "./format.js";
import { dots, weekView } from "./views/week.js";
import { listView } from "./views/list.js";
import { cookPick, cookView } from "./views/cook.js";
import { sheets } from "./views/sheets.js";

const PENDING_MS = 20 * 60 * 1000;

const STATUS = {
  none: { label: "Nog geen voorstel", tag: "neutral" },
  proposed: { label: "Voorstel klaar", tag: "neutral" },
  approving: { label: "Mandje vullen…", tag: "neutral" },
  approved: { label: "In je Picnic-mandje", tag: "ok" },
};

class WeekmenuPanel extends LitElement {
  static styles = styles;

  static properties = {
    hass: { attribute: false },
    narrow: { type: Boolean },
    panel: { attribute: false },
    data: { state: true },
    error: { state: true },
    ui: { state: true },
    ov: { state: true },
    toast: { state: true },
    sugg: { state: true },
    now: { state: true },
  };

  constructor() {
    super();
    this.data = null;
    this.error = null;
    this.ui = { tab: "week", seg: "week", openDay: null, sheet: null, cook: null, busy: false, priceLoading: false };
    this.ov = { items: {}, days: {} }; // optimistic changes until the server confirms
    this.sugg = {};
    this.now = Date.now();
    this._seq = 0;
    this._rang = new Set();
    this._onVisible = () => this._visibility();
    this._onKey = (e) => e.key === "Escape" && this._escape();
  }

  // ---------- lifecycle ----------
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this._onVisible);
    window.addEventListener("keydown", this._onKey);
    if (this.hass) this._subscribe();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this._onVisible);
    window.removeEventListener("keydown", this._onKey);
    this._unsubscribe();
    clearInterval(this._tick);
    this._tick = null;
    this._releaseWake();
  }

  willUpdate(changed) {
    if (changed.has("hass") && this.hass) {
      if (!this._unsub) this._subscribe();
      const dark = !!this.hass.themes?.darkMode;
      if (dark !== this.hasAttribute("dark")) this.toggleAttribute("dark", dark);
    }
  }

  updated(changed) {
    if (!changed.has("ui")) return;
    const prev = changed.get("ui") || {};
    // a day was just opened: show its chosen option
    if (this.ui.jump) {
      const strip = this.renderRoot.querySelector(".strip[data-jump]");
      const idx = Number(strip?.dataset.jump);
      if (strip && !isNaN(idx)) {
        const card = strip.querySelectorAll(".ocard")[idx];
        strip.scrollLeft = card ? card.offsetLeft - 16 : 0;
        dots(strip);
      }
      this.ui.jump = false; // plain assignment: no extra render
    }
    // link sheet just opened: search for the typed name straight away
    if (this.ui.sheet?.type === "link" && prev.sheet?.type !== "link") {
      const inp = this.renderRoot.getElementById("link");
      if (inp) { inp.value = this.ui.sheet.name || ""; inp.focus(); this.onSearch("link", inp.value); }
    }
    if (this.ui.sheet && !prev.sheet) this.renderRoot.querySelector(".sheet")?.focus?.();
  }

  _subscribe() {
    if (this._unsub || !this.hass) return;
    this._unsub = this.hass.connection.subscribeMessage((data) => this._receive(data), { type: "weekmenu/subscribe" });
    this._unsub.then(() => (this.error = null)).catch((e) => {
      this._unsub = null;
      this.error = e?.message || String(e);
    });
  }

  _unsubscribe() {
    if (this._unsub) this._unsub.then((u) => u()).catch(() => {});
    this._unsub = null;
  }

  _receive(data) {
    this.data = data;
    this.error = null;
    // timers: tick while one runs, ring once when the server marks it done
    const timers = data.timers || [];
    for (const t of timers) if (t.done && !this._rang.has(t.id)) { this._rang.add(t.id); if (document.visibilityState === "visible") this._beep(); }
    if (timers.length && !this._tick) this._tick = setInterval(() => (this.now = Date.now()), 1000);
    if (!timers.length && this._tick) { clearInterval(this._tick); this._tick = null; }
  }

  _visibility() {
    if (document.visibilityState !== "visible") return;
    // resubscribe (e.g. after the integration was reloaded) and keep the screen on while cooking
    this._unsubscribe();
    this._subscribe();
    if (this.ui.cook) this._wakeLock();
  }

  _escape() {
    if (this.ui.sheet) this.setUi({ sheet: null });
    else if (this.ui.cook) this.closeCook();
  }

  // ---------- data helpers ----------
  get plan() { return this.data?.plan || null; }
  get days() { return this.plan?.days?.length ? this.plan.days.map((d) => (d.day in this.ov.days ? { ...d, choice: this.ov.days[d.day] } : d)) : null; }
  get summary() { return this.data?.view?.summary || {}; }
  get canEdit() { return this.data?.can_edit !== false; }
  get locked() { return ["approved", "approving"].includes(this.plan?.status) || !this.canEdit; }
  get userName() { return (this.hass?.user?.name || "").toLowerCase(); }
  items() {
    const base = this.data?.view?.items || this.plan?.items || [];
    return base.map((i) => (this.ov.items[i.key] ? { ...i, ...this.ov.items[i.key] } : i));
  }
  active() { return this.items().filter((i) => !i.removed && i.qty > 0); }
  recipe(id) { return (this.plan?.recipes || []).find((r) => r.id === id); }
  status() { return STATUS[this.plan?.status || "none"] || STATUS.proposed; }
  pending(d) {
    const at = d.pending?.at ? Date.parse(d.pending.at) : 0;
    return at ? (Date.now() - at < PENDING_MS ? "busy" : "expired") : null;
  }
  setUi(patch) { this.ui = { ...this.ui, ...patch }; }

  // ---------- websocket ----------
  async ws(msg, { quiet = false } = {}) {
    try {
      return await this.hass.connection.sendMessagePromise(msg);
    } catch (e) {
      if (!quiet) this.showToast(e?.message || "Dat lukte niet");
      throw e;
    }
  }

  /** Change shown immediately; rolled back when the server says no. */
  async optimistic(kind, key, patch, msg) {
    const seq = ++this._seq;
    this.ov = { ...this.ov, [kind]: { ...this.ov[kind], [key]: kind === "days" ? patch : { ...this.ov[kind][key], ...patch, _seq: seq } } };
    try {
      await this.ws(msg);
    } catch (_) { /* toast shown; rollback below */ }
    const cur = this.ov[kind][key];
    if (kind === "days" || cur?._seq === seq) {
      const next = { ...this.ov[kind] };
      delete next[key];
      this.ov = { ...this.ov, [kind]: next };
    }
  }

  showToast(text, undo = null) {
    clearTimeout(this._toastT);
    this.toast = { text, undo };
    this._toastT = setTimeout(() => (this.toast = null), undo ? 6000 : 3500);
  }

  // ---------- search (suggestions while typing) ----------
  onSearch(field, value) {
    clearTimeout(this._sugT);
    const q = (value || "").trim();
    if (q.length < 2) { if (this.sugg[field]) this.sugg = { ...this.sugg, [field]: null }; return; }
    this._sugT = setTimeout(async () => {
      this.sugg = { ...this.sugg, [field]: { q, items: this.sugg[field]?.items || [], loading: true } };
      try {
        const r = await this.ws({ type: "weekmenu/search", query: q }, { quiet: true });
        const cur = this.renderRoot.getElementById(field)?.value.trim();
        if (cur !== q) return;
        this.sugg = { ...this.sugg, [field]: { q, items: r.results || [], loading: false } };
      } catch (_) {
        this.sugg = { ...this.sugg, [field]: null };
      }
    }, 250);
  }

  clearSearch(field) {
    const inp = this.renderRoot.getElementById(field);
    if (inp) inp.value = "";
    this.sugg = { ...this.sugg, [field]: null };
  }

  async pick(field, it) {
    const item = { name: it.name, picnic_id: it.picnic_id || null, image_id: it.image_id || null, unit: it.unit || null, unit_price: it.unit_price ?? null };
    this.clearSearch(field);
    if (field.startsWith("own-")) {
      await this.ws({ type: "weekmenu/answer_item", question_id: field.slice(4), item });
      this.showToast(`${it.name} gekozen`);
    } else if (field === "link") {
      const key = this.ui.sheet?.key;
      this.setUi({ sheet: null });
      await this.ws({ type: "weekmenu/link_item", key, item });
      this.showToast(`Gekoppeld aan ${it.name}`);
    } else {
      await this.ws({ type: "weekmenu/add_item", item, qty: 1, target: field === "addstd" ? "standard" : "week" });
      this.showToast(`${it.name} toegevoegd`);
    }
  }

  async searchEnter(field) {
    const inp = this.renderRoot.getElementById(field);
    const text = inp?.value.trim();
    if (!text) return;
    const first = this.sugg[field]?.items?.[0];
    // a matching Picnic product beats loose text (Picnic would otherwise guess by name)
    if (first?.picnic_id) return this.pick(field, first);
    if (field === "link") return;
    this.clearSearch(field);
    if (field.startsWith("own-")) {
      await this.ws({ type: "weekmenu/answer_text", question_id: field.slice(4), text });
      this.showToast("Genoteerd. Die bied ik volgende keer ook aan.");
    } else {
      await this.ws({ type: field === "addweek" ? "weekmenu/add_text" : "weekmenu/standard_add", text });
      this.showToast(field === "addweek" ? "Toegevoegd. Nog niet gekoppeld aan Picnic." : "Toegevoegd");
    }
  }

  // ---------- list actions ----------
  setQty(it, qty) {
    if (qty <= 0) return this.remove(it);
    this.optimistic("items", it.key, { qty }, { type: "weekmenu/item_qty", key: it.key, qty });
  }

  remove(it) {
    this.optimistic("items", it.key, { removed: true }, { type: "weekmenu/item_removed", key: it.key, removed: true });
    const text = it.source === "advice" ? `Oké, nog genoeg ${it.name.toLowerCase()}. Ik vraag het later weer.` : `${it.name} weggehaald`;
    this.showToast(text, () => this.ws({ type: "weekmenu/item_removed", key: it.key, removed: false }));
  }

  restore(it) { this.ws({ type: "weekmenu/item_removed", key: it.key, removed: false }); }

  stdQty(it, qty) {
    if (qty > 0) return this.ws({ type: "weekmenu/standard_qty", key: it.key, qty });
    this.ws({ type: "weekmenu/standard_qty", key: it.key, qty: 0 });
    const item = { name: it.name, picnic_id: it.picnic_id || null, image_id: it.image_id || null, unit: it.unit || null, unit_price: it.unit_price ?? null };
    this.showToast(`${it.name} van je vaste lijst gehaald`, () => this.ws({ type: "weekmenu/add_item", item, qty: it.qty, target: "standard" }));
  }

  // ---------- week actions ----------
  async choose(day, choice) {
    const days = this.days || [];
    const d = days.find((x) => x.day === day);
    if (!d) return;
    const next = d.choice === choice ? null : choice;
    const prev = next && next !== "none" ? days.find((x) => x.day !== day && x.choice === next) : null;
    if (this.ui.sheet?.type === "prep") this.setUi({ sheet: null });
    if (prev) this.ov = { ...this.ov, days: { ...this.ov.days, [prev.day]: null } };
    await this.optimistic("days", day, next, { type: "weekmenu/choose_day", day, choice: next });
    if (prev) {
      const { [prev.day]: _, ...rest } = this.ov.days;
      this.ov = { ...this.ov, days: rest };
      this.showToast(`Verplaatst van ${dayName(prev.day)} naar ${dayName(day)}`);
    }
  }

  async requestRecipes(day) {
    if (!this.data?.claude_ready) return this.showToast("Stel eerst de Claude-koppeling in bij Weekmenu → Configureren");
    const wish = this.renderRoot.getElementById(`wish-${day}`)?.value.trim() || null;
    try {
      await this.ws({ type: "weekmenu/request_recipes", day, wish });
      this.showToast("Claude is bezig. De nieuwe gerechten verschijnen vanzelf.");
    } catch (_) { /* toast */ }
  }

  async priceCheck() {
    if (this.ui.priceLoading) return;
    this.setUi({ priceLoading: true });
    try {
      const result = await this.ws({ type: "weekmenu/price_check" });
      this.setUi({ sheet: { type: "price", result, sel: new Set() } });
    } catch (_) { /* toast */ } finally {
      this.setUi({ priceLoading: false });
    }
  }

  async applyPrices() {
    const { result, sel } = this.ui.sheet;
    const changes = result.suggestions.filter((x) => sel.has(x.key)).map((x) => ({ key: x.key, alt: x.alt }));
    this.setUi({ sheet: null });
    const r = await this.ws({ type: "weekmenu/apply_prices", changes }).catch(() => null);
    if (r) this.showToast(`${plural(r.applied, "product", "producten")} vervangen · ${eur(r.saving)} goedkoper`);
  }

  async approve() {
    this.setUi({ sheet: null, busy: true });
    try {
      const r = await this.ws({ type: "weekmenu/approve", allow_open_days: true });
      const parts = [r.failed ? `${r.added} in je mandje, ${r.failed} niet gelukt` : r.added ? `${plural(r.added, "product", "producten")} in je Picnic-mandje` : "Je mandje was al compleet"];
      if (r.to_remove?.length) parts.push(`haal ${plural(r.to_remove.length, "product", "producten")} zelf weg in Picnic`);
      this.showToast(parts.join(" · "));
      this.setUi({ tab: "week" });
    } catch (_) { /* toast */ } finally {
      this.setUi({ busy: false });
    }
  }

  reopen() { this.ws({ type: "weekmenu/reopen" }); }

  rate(rid, v) {
    this.ws({ type: "weekmenu/feedback", recipe_id: rid, rating: v }).then(() => this.showToast("Dank je. Daar houd ik rekening mee."));
  }

  // ---------- cooking ----------
  openCook(rid) {
    this.setUi({ cook: { rid, step: -1, checked: {} }, sheet: null });
    this._wakeLock();
  }

  closeCook() { this.setUi({ cook: null }); this._releaseWake(); }

  cookStep(delta) {
    const c = this.ui.cook;
    const n = (this.recipe(c.rid)?.steps || []).length;
    this.setUi({ cook: { ...c, step: Math.max(-1, Math.min(n, c.step + delta)) } });
  }

  startTimer(seconds, label) {
    this._unlockAudio();
    this.ws({ type: "weekmenu/timer_start", seconds, label, recipe_id: this.ui.cook?.rid || null });
  }

  stopTimer(id) { this.ws({ type: "weekmenu/timer_stop", id }); }

  async _wakeLock() {
    try { if ("wakeLock" in navigator && !this._wake) { this._wake = await navigator.wakeLock.request("screen"); this._wake.addEventListener("release", () => (this._wake = null)); } } catch (_) { /* not allowed */ }
  }

  _releaseWake() { try { this._wake?.release(); } catch (_) { /* ignore */ } this._wake = null; }

  // iOS only plays sound from an AudioContext created/resumed inside a tap
  _unlockAudio() {
    try {
      this._audio = this._audio || new (window.AudioContext || window.webkitAudioContext)();
      if (this._audio.state === "suspended") this._audio.resume();
    } catch (_) { /* no audio */ }
  }

  _beep() {
    try {
      const ctx = this._audio || (this._audio = new (window.AudioContext || window.webkitAudioContext)());
      [0, 0.35, 0.7].forEach((t) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3);
      });
      navigator.vibrate?.([200, 100, 200]);
    } catch (_) { /* no audio */ }
  }

  // ---------- render ----------
  render() {
    const tabs = [["week", "Week", I.week], ["list", "Lijst", I.cart], ["cook", "Koken", I.cook]];
    const bar = this._actionBar();
    const openDays = (this.summary.days_open || []).length;
    return html`<div class="app" style=${bar ? "--bar-h: 72px" : ""}>
      <header>
        ${this.narrow ? html`<ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>` : nothing}
        <h1>Weekmenu${this.plan ? html`<span class="sub">${this._subtitle()}</span>` : nothing}</h1>
        ${this.narrow ? nothing : html`<nav class="htabs" role="tablist">${tabs.map(([k, l, ic]) => html`
          <button role="tab" aria-selected=${this.ui.tab === k} @click=${() => this.setUi({ tab: k })}>${icon(ic)}${l}</button>`)}</nav>`}
      </header>
      <main><div class="wrap">${this._body()}</div></main>
      ${bar}
      ${this.narrow ? html`<nav class="tabbar" role="tablist">${tabs.map(([k, l, ic]) => html`
        <button role="tab" aria-selected=${this.ui.tab === k} @click=${() => this.setUi({ tab: k })}>
          <span class="pill">${icon(ic)}</span>${l}${k === "week" && openDays && !this.locked ? html`<span class="badge" aria-label="${openDays} open">${openDays}</span>` : nothing}
        </button>`)}</nav>` : nothing}
      ${sheets(this)}
      ${this.ui.cook ? cookView(this) : nothing}
      ${this.toast ? html`<div class="toast" role="status" aria-live="polite"><span class="grow">${this.toast.text}</span>
        ${this.toast.undo ? html`<button @click=${() => { const u = this.toast.undo; this.toast = null; u(); }}>${icon(I.undo, "sm")} Ongedaan</button>` : nothing}</div>` : nothing}
    </div>`;
  }

  _subtitle() {
    const p = this.plan;
    const wk = /W(\d+)/.exec(p.week || "")?.[1];
    return [wk ? `Week ${Number(wk)}` : "", this.status().label].filter(Boolean).join(" · ");
  }

  _body() {
    if (this.error) {
      return html`<div class="empty">${icon(I.alert)}<p>${this.error}</p>
        <button class="btn tonal" @click=${() => { this._unsubscribe(); this._subscribe(); }}>${icon(I.refresh)} Opnieuw</button></div>`;
    }
    if (!this.data) {
      return html`<div class="stack" aria-busy="true"><div class="skel" style="height:120px"></div><div class="skel" style="height:320px"></div></div>`;
    }
    if (this.ui.tab === "list") return listView(this);
    if (this.ui.tab === "cook") return cookPick(this);
    return weekView(this);
  }

  /** Sticky primary action: send to Picnic (or progress while it runs). */
  _actionBar() {
    const p = this.plan;
    if (!p || this.ui.tab === "cook" || !this.canEdit || this.ui.cook) return nothing;
    const sm = this.summary;
    if (p.status === "approving" || this.ui.busy) {
      const pr = p.progress || { done: 0, total: 1 };
      return html`<div class="actionbar" role="status"><div class="sum"><b>Mandje vullen…</b>
        <span>${pr.done} van ${pr.total} producten</span>
        <div class="progress"><i style="width:${Math.round((100 * pr.done) / Math.max(1, pr.total))}%"></i></div></div></div>`;
    }
    if (p.status !== "proposed") return nothing;
    const resend = Object.keys(p.sent || {}).length > 0;
    const facts = [plural(sm.items_count || 0, "product", "producten")];
    if (sm.unknown_prices) facts.push(`${sm.unknown_prices} zonder prijs`);
    if (sm.savings > 0) facts.push(`${eur(sm.savings)} voordeel`);
    return html`<div class="actionbar">
      <div class="sum"><b>${eur(sm.items_total)}${sm.unknown_prices ? "+" : ""}</b><span>${facts.join(" · ")}</span></div>
      <button class="btn" @click=${() => this.setUi({ sheet: { type: "approve" } })}>${icon(I.toCart)}${resend ? "Wijzigingen naar Picnic" : "Naar Picnic"}</button>
    </div>`;
  }

  deliveryLine() {
    const p = this.plan;
    const out = [];
    if (p.delivery_at || p.delivery) out.push(`Bezorging ${when(p.delivery_at, p.delivery)}`);
    if (p.status !== "approved" && (p.order_deadline_at || p.order_deadline)) out.push(`bestellen tot ${when(p.order_deadline_at, p.order_deadline)}`);
    return out.join(" · ");
  }
}

// After an update an open app can load the new module next to the old one; defining twice throws.
if (!customElements.get("weekmenu-panel")) customElements.define("weekmenu-panel", WeekmenuPanel);
