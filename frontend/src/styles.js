import { css, unsafeCSS } from "lit";
import { colorVars, ELEVATION, SCALE } from "./tokens.js";

export const styles = css`
:host {
  ${unsafeCSS(colorVars("light"))}
  ${unsafeCSS(ELEVATION.light)}
  ${unsafeCSS(SCALE)}
  display: block; height: 100%;
  font-family: var(--wm-font); font-size: var(--wm-fs-md); line-height: 1.4;
  color: var(--wm-text); background: var(--wm-bg);
  -webkit-tap-highlight-color: transparent;
}
:host([dark]) {
  ${unsafeCSS(colorVars("dark"))}
  ${unsafeCSS(ELEVATION.dark)}
}
* { box-sizing: border-box; }
button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; padding: 0; text-align: inherit; }
button:focus-visible, input:focus-visible, [tabindex]:focus-visible { outline: 2px solid var(--wm-accent); outline-offset: 2px; }
button[disabled] { cursor: default; }
svg.i { width: 20px; height: 20px; flex: none; fill: currentColor; display: block; }
svg.i.sm { width: 16px; height: 16px; }
svg.i.lg { width: 24px; height: 24px; }
.vh { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* ---------- shell ---------- */
.app { display: flex; flex-direction: column; height: 100%; }
header {
  display: flex; align-items: center; gap: var(--wm-s2); height: 56px; flex: none;
  padding: 0 var(--wm-s3); padding-top: env(safe-area-inset-top);
  box-sizing: content-box;
  background: var(--app-header-background-color, var(--wm-surface)); color: var(--app-header-text-color, var(--wm-text));
  border-bottom: 1px solid var(--wm-line);
}
header h1 { margin: 0; font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-medium); flex: 1; min-width: 0; }
header .sub { display: block; font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-regular); opacity: .75; }
.htabs { display: flex; gap: var(--wm-s1); }
.htabs button { display: flex; align-items: center; gap: var(--wm-s2); height: 40px; padding: 0 var(--wm-s4); border-radius: var(--wm-r-full); font-size: var(--wm-fs-sm); font-weight: var(--wm-fw-medium); opacity: .8; }
.htabs button[aria-selected="true"] { background: var(--wm-accent-soft); color: var(--wm-accent); opacity: 1; }
main { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
.wrap { max-width: 1120px; margin: 0 auto; padding: var(--wm-s4) var(--wm-s4) calc(var(--wm-s6) + var(--bar-h, 0px)); }
.tabbar {
  display: flex; flex: none; background: var(--wm-surface); border-top: 1px solid var(--wm-line);
  padding-bottom: env(safe-area-inset-bottom);
}
.tabbar button { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: var(--wm-s2) 0 6px; font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-medium); color: var(--wm-text2); }
.tabbar button .pill { padding: 4px 18px; border-radius: var(--wm-r-full); transition: background .2s; }
.tabbar button[aria-selected="true"] { color: var(--wm-text); }
.tabbar button[aria-selected="true"] .pill { background: var(--wm-accent-soft); color: var(--wm-accent); }
.tabbar .badge { position: absolute; margin: -4px 0 0 18px; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background: var(--wm-attention); color: var(--wm-surface); font-size: 11px; line-height: 16px; text-align: center; }

/* ---------- action bar (sticky primary action) ---------- */
.actionbar {
  flex: none; display: flex; align-items: center; gap: var(--wm-s3);
  padding: var(--wm-s3) max(var(--wm-s4), calc((100% - 1120px) / 2 + var(--wm-s4))); background: var(--wm-surface); border-top: 1px solid var(--wm-line);
}
.actionbar .sum { flex: 1; min-width: 0; line-height: 1.25; }
.actionbar .sum b { font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-bold); font-variant-numeric: tabular-nums; }
.actionbar .sum span { display: block; font-size: var(--wm-fs-xs); color: var(--wm-text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.progress { height: 4px; border-radius: 2px; background: var(--wm-accent-soft); overflow: hidden; margin-top: 6px; }
.progress i { display: block; height: 100%; background: var(--wm-accent); transition: width .3s var(--wm-ease); }

/* ---------- buttons ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--wm-s2);
  min-height: 48px; padding: 0 var(--wm-s5); border-radius: var(--wm-r-md);
  font-weight: var(--wm-fw-medium); background: var(--wm-accent); color: var(--wm-on-accent);
  transition: transform .1s, opacity .2s; white-space: nowrap;
}
.btn:active:not([disabled]) { transform: scale(.98); }
.btn[disabled] { opacity: .45; }
.btn.tonal { background: var(--wm-accent-soft); color: var(--wm-accent); }
.btn.outline { background: transparent; color: var(--wm-accent); box-shadow: inset 0 0 0 1.5px var(--wm-accent); }
.btn.plain { background: transparent; color: var(--wm-text); box-shadow: inset 0 0 0 1px var(--wm-border); }
.btn.danger { background: var(--wm-danger); color: var(--wm-on-danger); }
.btn.sm { min-height: 40px; padding: 0 var(--wm-s4); font-size: var(--wm-fs-sm); }
.btn.block { width: 100%; }
.link { color: var(--wm-accent); font-weight: var(--wm-fw-medium); font-size: var(--wm-fs-sm); display: inline-flex; align-items: center; gap: var(--wm-s1); min-height: 40px; }
.iconbtn { width: 40px; height: 40px; border-radius: var(--wm-r-full); display: grid; place-items: center; color: var(--wm-text2); }
.iconbtn:hover { background: var(--wm-surface2); }

/* ---------- surfaces & text ---------- */
.card { background: var(--wm-surface); border-radius: var(--wm-r-lg); padding: var(--wm-s4); box-shadow: var(--wm-shadow-1), inset 0 0 0 1px var(--wm-edge); }
.card + .card, .card + .section, .section + .card { margin-top: var(--wm-s4); }
.section { margin-top: var(--wm-s5); }
.section:first-child { margin-top: 0; }
.sh { display: flex; align-items: baseline; justify-content: space-between; gap: var(--wm-s3); margin: 0 var(--wm-s1) var(--wm-s3); }
.sh h2 { margin: 0; font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-medium); }
.sh .meta { font-size: var(--wm-fs-sm); color: var(--wm-text2); font-variant-numeric: tabular-nums; }
.muted { color: var(--wm-text2); }
.xs { font-size: var(--wm-fs-xs); }
.sm { font-size: var(--wm-fs-sm); }
.num { font-variant-numeric: tabular-nums; }
.row { display: flex; align-items: center; gap: var(--wm-s3); }
.row.wrap { flex-wrap: wrap; }
.grow { flex: 1; min-width: 0; }
.stack > * + * { margin-top: var(--wm-s3); }

/* tags: one look per colour role */
.tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--wm-r-sm); font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-medium); line-height: 18px; white-space: nowrap; }
.tag.neutral { background: var(--wm-surface2); color: var(--wm-text2); }
.tag.ok { background: var(--wm-accent-soft); color: var(--wm-accent); }
.tag.deal { background: var(--wm-deal-soft); color: var(--wm-deal); }
.tag.attention { background: var(--wm-attention-soft); color: var(--wm-attention); }
.tag.danger { background: var(--wm-danger-soft); color: var(--wm-danger); }
.save { color: var(--wm-accent); font-weight: var(--wm-fw-medium); }

/* ---------- week: status ---------- */
.status .total { font-size: var(--wm-fs-xl); font-weight: var(--wm-fw-bold); letter-spacing: -.01em; font-variant-numeric: tabular-nums; line-height: 1.1; }
.status .facts { display: flex; flex-wrap: wrap; gap: var(--wm-s1) var(--wm-s3); font-size: var(--wm-fs-sm); color: var(--wm-text2); }
.status .actions { display: flex; gap: var(--wm-s2); flex-wrap: wrap; }
.status .actions .btn { flex: 1; }
.note { display: flex; gap: var(--wm-s2); align-items: flex-start; font-size: var(--wm-fs-sm); padding: var(--wm-s3); border-radius: var(--wm-r-md); background: var(--wm-surface2); }
.note svg { color: var(--wm-text2); margin-top: 1px; }
.note.attention { background: var(--wm-attention-soft); color: var(--wm-attention); }
.note.attention svg { color: inherit; }
.note.danger { background: var(--wm-danger-soft); color: var(--wm-danger); }
.note.danger svg { color: inherit; }
.note ul { margin: 4px 0 0; padding-left: 18px; }

/* ---------- tonight / rate ---------- */
.tonight { padding: 0; overflow: hidden; display: grid; grid-template-columns: 1fr; }
.tonight .photo { aspect-ratio: 16 / 8; background: var(--wm-surface2); display: grid; place-items: center; font-size: 56px; overflow: hidden; }
.tonight .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.tonight .body { padding: var(--wm-s4); display: grid; gap: var(--wm-s3); }
.eyebrow { font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-bold); letter-spacing: .06em; text-transform: uppercase; color: var(--wm-text2); }
.tonight h3 { margin: 0; font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-medium); line-height: 1.25; }
.rate { display: flex; gap: var(--wm-s2); }
.rate button { flex: 1; min-height: 48px; border-radius: var(--wm-r-md); display: flex; align-items: center; justify-content: center; gap: var(--wm-s2); box-shadow: inset 0 0 0 1px var(--wm-border); font-weight: var(--wm-fw-medium); }
.rate button[aria-pressed="true"] { background: var(--wm-accent-soft); color: var(--wm-accent); box-shadow: inset 0 0 0 1.5px var(--wm-accent); }

/* ---------- week: days ---------- */
.prog { display: flex; gap: 4px; margin: 0 var(--wm-s1) var(--wm-s3); }
.prog i { flex: 1; height: 6px; border-radius: 3px; box-shadow: inset 0 0 0 1.5px var(--wm-border); }
.prog i.on { background: var(--wm-accent); box-shadow: none; }
.prog i.none { box-shadow: none; background: repeating-linear-gradient(135deg, var(--wm-border) 0 3px, transparent 3px 6px); }
.days { background: var(--wm-surface); border-radius: var(--wm-r-lg); overflow: hidden; box-shadow: var(--wm-shadow-1), inset 0 0 0 1px var(--wm-edge); }
.day + .day { border-top: 1px solid var(--wm-line); }
.dhead { width: 100%; display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s3) var(--wm-s4); min-height: 72px; }
.day.past .dhead { opacity: .55; }
.dtile { width: 48px; height: 52px; flex: none; border-radius: var(--wm-r-md); background: var(--wm-surface2); display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1; }
.dtile small { font-size: 11px; font-weight: var(--wm-fw-bold); letter-spacing: .06em; text-transform: uppercase; color: var(--wm-text2); }
.dtile b { font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-bold); margin-top: 4px; font-variant-numeric: tabular-nums; }
.day.today .dtile { background: var(--wm-accent); color: var(--wm-on-accent); }
.day.today .dtile small { color: inherit; opacity: .85; }
.dmid { flex: 1; min-width: 0; display: grid; gap: 2px; }
.dslot { font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-medium); letter-spacing: .04em; text-transform: uppercase; color: var(--wm-text2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dmain { display: flex; align-items: center; gap: var(--wm-s2); min-width: 0; font-weight: var(--wm-fw-medium); }
.dmain .tt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dmain.open { color: var(--wm-attention); }
.dmain.open::before { content: ""; width: 8px; height: 8px; border-radius: 50%; flex: none; box-shadow: inset 0 0 0 2px currentColor; }
.dmain.none { color: var(--wm-text2); font-weight: var(--wm-fw-regular); }
.dthumb { width: 28px; height: 28px; border-radius: var(--wm-r-sm); object-fit: cover; flex: none; background: var(--wm-surface2); }
.dnote { font-size: var(--wm-fs-xs); color: var(--wm-text2); }
.dright { display: flex; align-items: center; gap: var(--wm-s1); color: var(--wm-text2); font-size: var(--wm-fs-sm); font-variant-numeric: tabular-nums; }
.chev { transition: transform .2s var(--wm-ease); }
.day.open .chev { transform: rotate(90deg); }
.dbody { animation: reveal .22s var(--wm-ease); }
@keyframes reveal { from { opacity: 0; transform: translateY(-4px); } }
.strip { display: flex; gap: var(--wm-s3); overflow-x: auto; scroll-snap-type: x mandatory; padding: 2px var(--wm-s4) var(--wm-s3); scrollbar-width: none; scroll-padding: 0 var(--wm-s4); }
.strip::-webkit-scrollbar { display: none; }
.ocard { scroll-snap-align: start; flex: 0 0 min(84%, 340px); border-radius: var(--wm-r-lg); background: var(--wm-surface2); display: flex; flex-direction: column; overflow: hidden; position: relative; box-shadow: inset 0 0 0 1px transparent; transition: box-shadow .2s; }
.ocard.on { box-shadow: inset 0 0 0 2px var(--wm-accent); }
.ocard .photo { aspect-ratio: 16 / 9; background: var(--wm-line); overflow: hidden; }
.ocard .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ocard .chosen { position: absolute; top: var(--wm-s3); right: var(--wm-s3); display: inline-flex; align-items: center; gap: 4px; background: var(--wm-accent); color: var(--wm-on-accent); font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-bold); padding: 4px 10px 4px 6px; border-radius: var(--wm-r-full); }
.ocard.on:not(:has(.photo)) .ohead { padding-right: 96px; }
.ocard .in { padding: var(--wm-s4); display: flex; flex-direction: column; gap: var(--wm-s3); flex: 1; }
.ohead { display: flex; gap: var(--wm-s3); align-items: flex-start; }
.oemoji { width: 48px; height: 48px; flex: none; border-radius: var(--wm-r-md); background: var(--wm-surface); display: grid; place-items: center; font-size: 26px; color: var(--wm-text2); }
.otitle { font-weight: var(--wm-fw-medium); line-height: 1.3; }
.ometa { font-size: var(--wm-fs-sm); color: var(--wm-text2); display: flex; flex-wrap: wrap; gap: 0 var(--wm-s2); margin-top: 2px; }
.ometa span + span::before { content: "·"; margin-right: var(--wm-s2); }
.ings { margin: 0; padding: 0; list-style: none; font-size: var(--wm-fs-sm); display: grid; gap: 4px; }
.ings li { display: flex; gap: var(--wm-s2); align-items: baseline; min-width: 0; }
.ings .q { color: var(--wm-text2); font-variant-numeric: tabular-nums; }
.ings .n { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ings .more { color: var(--wm-text2); }
.ofoot { margin-top: auto; display: grid; gap: var(--wm-s1); }
.ocard.on .ofoot .btn { background: transparent; color: var(--wm-accent); box-shadow: inset 0 0 0 1.5px var(--wm-accent); }
.ocard.more { background: transparent; box-shadow: inset 0 0 0 1.5px var(--wm-border); }
.ocard.more input { width: 100%; }
.spin { animation: spin 1.2s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.sdots { display: flex; gap: 6px; justify-content: center; padding: 0 0 var(--wm-s4); }
.sdots i { width: 6px; height: 6px; border-radius: 3px; background: var(--wm-border); opacity: .5; transition: width .2s, opacity .2s, background .2s; }
.sdots i.on { width: 18px; opacity: 1; background: var(--wm-text2); }
.sdots i.ch { background: var(--wm-accent); opacity: 1; }
.weekgrid { display: grid; gap: var(--wm-s5); align-items: start; }
.weekgrid > div { min-width: 0; }

/* ---------- questions / michelle ---------- */
.q + .q { border-top: 1px solid var(--wm-line); margin-top: var(--wm-s4); padding-top: var(--wm-s4); }
.qt { display: flex; gap: var(--wm-s2); align-items: center; font-weight: var(--wm-fw-medium); margin-bottom: var(--wm-s2); }
.qt .who { width: 28px; height: 28px; border-radius: 50%; background: var(--wm-surface2); display: grid; place-items: center; font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-bold); color: var(--wm-text2); flex: none; }
.qt .sub { font-weight: var(--wm-fw-regular); color: var(--wm-text2); font-size: var(--wm-fs-sm); }
.chips { display: flex; flex-wrap: wrap; gap: var(--wm-s2); }
.chip { display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: var(--wm-r-full); box-shadow: inset 0 0 0 1px var(--wm-border); font-size: var(--wm-fs-sm); font-weight: var(--wm-fw-medium); }
.chip[aria-pressed="true"] { background: var(--wm-accent); color: var(--wm-on-accent); box-shadow: none; }
.chip .new { font-size: 11px; color: var(--wm-text2); font-weight: var(--wm-fw-regular); }
.chip[aria-pressed="true"] .new { color: inherit; opacity: .8; }
.opts { display: grid; gap: var(--wm-s2); margin-top: var(--wm-s3); }
.opt { display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s3); border-radius: var(--wm-r-md); background: var(--wm-surface2); min-height: 56px; }
.opt[aria-pressed="true"] { background: var(--wm-accent-soft); box-shadow: inset 0 0 0 2px var(--wm-accent); }
.opt .e { font-size: 24px; }
.opt .n { flex: 1; font-weight: var(--wm-fw-medium); }

/* ---------- inputs & search ---------- */
.field { position: relative; }
.input {
  width: 100%; min-width: 0; height: 48px; padding: 0 var(--wm-s4) 0 44px; border-radius: var(--wm-r-md);
  border: 1px solid var(--wm-border); background: var(--wm-surface); color: var(--wm-text);
  font: inherit; font-size: 16px; outline: none;
}
.input.plain { padding-left: var(--wm-s4); }
.input::placeholder { color: var(--wm-text2); }
.input:focus { border-color: var(--wm-accent); box-shadow: 0 0 0 1px var(--wm-accent); outline: none; }
.field > svg { position: absolute; left: 14px; top: 14px; color: var(--wm-text2); pointer-events: none; }
.sugg { margin-top: var(--wm-s1); background: var(--wm-surface); border-radius: var(--wm-r-md); box-shadow: var(--wm-shadow-2), inset 0 0 0 1px var(--wm-edge); overflow: hidden; }
.sugg button { width: 100%; display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s2) var(--wm-s3); min-height: 56px; }
.sugg button + button, .sugg .hint + button { border-top: 1px solid var(--wm-line); }
.sugg button:hover, .sugg button:focus-visible { background: var(--wm-surface2); }
.sugg .hint { padding: var(--wm-s3); font-size: var(--wm-fs-sm); color: var(--wm-text2); }
.sugg .plus { color: var(--wm-accent); }

/* ---------- list ---------- */
.seg { display: flex; padding: 4px; border-radius: var(--wm-r-md); background: var(--wm-surface2); margin-bottom: var(--wm-s4); }
.seg button { flex: 1; height: 40px; border-radius: var(--wm-r-sm); font-size: var(--wm-fs-sm); font-weight: var(--wm-fw-medium); color: var(--wm-text2); text-align: center; }
.seg button[aria-selected="true"] { background: var(--wm-surface); color: var(--wm-text); box-shadow: var(--wm-shadow-1), inset 0 0 0 1px var(--wm-edge); }
.tools { display: grid; gap: var(--wm-s2); margin-bottom: var(--wm-s2); }
.gh { display: flex; justify-content: space-between; align-items: baseline; margin: var(--wm-s5) var(--wm-s1) var(--wm-s2); font-weight: var(--wm-fw-medium); }
.gh span:last-child { color: var(--wm-text2); font-weight: var(--wm-fw-regular); font-size: var(--wm-fs-sm); font-variant-numeric: tabular-nums; }
.group { background: var(--wm-surface); border-radius: var(--wm-r-lg); overflow: hidden; box-shadow: var(--wm-shadow-1), inset 0 0 0 1px var(--wm-edge); }
.rowwrap { position: relative; overflow: hidden; }
.rowwrap + .rowwrap { border-top: 1px solid var(--wm-line); }
.rowwrap .behind { position: absolute; inset: 0; background: var(--wm-danger); color: var(--wm-on-danger); display: flex; align-items: center; justify-content: flex-end; gap: var(--wm-s2); padding-right: var(--wm-s5); font-weight: var(--wm-fw-medium); opacity: 0; }
.rowwrap.drag .behind { opacity: 1; }
.item { position: relative; display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s3); background: var(--wm-surface); touch-action: pan-y; transition: transform .2s var(--wm-ease); }
.item.dragging { transition: none; }
.thumb { width: 48px; height: 48px; flex: none; border-radius: var(--wm-r-md); background: var(--wm-surface2); display: grid; place-items: center; overflow: hidden; color: var(--wm-text2); }
.thumb img { width: 100%; height: 100%; object-fit: contain; }
.info { flex: 1; min-width: 0; }
.info .n { font-weight: var(--wm-fw-medium); line-height: 1.25; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.info .s { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 6px; margin-top: 4px; font-size: var(--wm-fs-xs); color: var(--wm-text2); }
.stepper { display: flex; align-items: center; border-radius: var(--wm-r-full); box-shadow: inset 0 0 0 1px var(--wm-border); }
.stepper button { width: 40px; height: 40px; border-radius: var(--wm-r-full); display: grid; place-items: center; color: var(--wm-accent); }
.stepper span { min-width: 20px; text-align: center; font-weight: var(--wm-fw-medium); font-variant-numeric: tabular-nums; }
.price { width: 64px; text-align: right; font-size: var(--wm-fs-sm); font-weight: var(--wm-fw-medium); font-variant-numeric: tabular-nums; }
.price.unknown { color: var(--wm-text2); font-weight: var(--wm-fw-regular); }
details.removed { margin-top: var(--wm-s5); }
details.removed summary { cursor: pointer; color: var(--wm-text2); font-weight: var(--wm-fw-medium); padding: var(--wm-s2) var(--wm-s1); list-style: none; display: flex; align-items: center; gap: var(--wm-s2); }
details.removed .r { display: flex; justify-content: space-between; align-items: center; padding: var(--wm-s2) var(--wm-s4); color: var(--wm-text2); }

/* ---------- empty / skeleton ---------- */
.empty { text-align: center; padding: var(--wm-s6) var(--wm-s4); color: var(--wm-text2); display: grid; justify-items: center; gap: var(--wm-s3); }
.empty svg { width: 48px; height: 48px; opacity: .6; }
.empty p { margin: 0; max-width: 32ch; }
.skel { background: linear-gradient(90deg, var(--wm-surface2) 25%, var(--wm-line) 50%, var(--wm-surface2) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: var(--wm-r-lg); }
@keyframes shimmer { to { background-position: -200% 0; } }

/* ---------- sheets ---------- */
.scrim { position: fixed; inset: 0; background: var(--wm-scrim); z-index: 15; animation: fade .2s; }
@keyframes fade { from { opacity: 0; } }
.sheet {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 16; max-height: 88vh; overflow-y: auto; overscroll-behavior: contain;
  background: var(--wm-surface); border-radius: var(--wm-r-lg) var(--wm-r-lg) 0 0;
  padding: var(--wm-s2) var(--wm-s5) calc(var(--wm-s5) + env(safe-area-inset-bottom));
  box-shadow: var(--wm-shadow-2); max-width: 640px; margin: 0 auto; animation: up .28s var(--wm-ease);
}
@keyframes up { from { transform: translateY(40px); opacity: 0; } }
.sheet .grab { width: 36px; height: 4px; border-radius: 2px; background: var(--wm-border); opacity: .6; margin: 0 auto var(--wm-s4); }
.sheet h3 { margin: 0; font-size: var(--wm-fs-lg); font-weight: var(--wm-fw-medium); line-height: 1.3; }
.sheet .sec { font-size: var(--wm-fs-xs); font-weight: var(--wm-fw-bold); letter-spacing: .06em; text-transform: uppercase; color: var(--wm-text2); margin: var(--wm-s5) 0 var(--wm-s2); }
.sheet ol { margin: 0; padding-left: 20px; display: grid; gap: var(--wm-s2); }
.sheet .photo { aspect-ratio: 16 / 9; border-radius: var(--wm-r-md); overflow: hidden; margin-bottom: var(--wm-s4); background: var(--wm-surface2); }
.sheet .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sheet .acts { display: flex; gap: var(--wm-s2); margin-top: var(--wm-s5); position: sticky; bottom: calc(-1 * var(--wm-s5)); background: var(--wm-surface); padding: var(--wm-s3) 0 0; }
.sheet .acts .btn { flex: 1; }
.sheet .acts .btn.main { flex: 2; }
.lines { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
.lines li { display: flex; justify-content: space-between; gap: var(--wm-s3); padding: var(--wm-s2) 0; border-bottom: 1px solid var(--wm-line); font-size: var(--wm-fs-sm); }
.lines li:last-child { border-bottom: 0; }
.lines li b { font-weight: var(--wm-fw-medium); font-variant-numeric: tabular-nums; }
.prow { display: flex; gap: var(--wm-s3); align-items: flex-start; width: 100%; padding: var(--wm-s3); border-radius: var(--wm-r-md); background: var(--wm-surface2); }
.prow + .prow { margin-top: var(--wm-s2); }
.prow[aria-checked="true"] { background: var(--wm-accent-soft); }
.box { flex: none; width: 22px; height: 22px; border-radius: 6px; box-shadow: inset 0 0 0 2px var(--wm-border); display: grid; place-items: center; color: var(--wm-on-accent); margin-top: 1px; }
[aria-checked="true"] > .box { background: var(--wm-accent); box-shadow: none; }
.prow .pt { flex: 1; min-width: 0; font-size: var(--wm-fs-sm); }
.prow .was { color: var(--wm-text2); text-decoration: line-through; }
.prow .nu { font-weight: var(--wm-fw-medium); }
.prow .ps { flex: none; font-weight: var(--wm-fw-bold); color: var(--wm-accent); font-variant-numeric: tabular-nums; }

/* ---------- cooking ---------- */
.cook { position: fixed; inset: 0; z-index: 20; background: var(--wm-surface); display: flex; flex-direction: column; animation: fade .2s; }
.cook .top { display: flex; align-items: center; gap: var(--wm-s3); padding: calc(var(--wm-s2) + env(safe-area-inset-top)) var(--wm-s3) var(--wm-s2) var(--wm-s4); border-bottom: 1px solid var(--wm-line); }
.cook .top .t { flex: 1; font-weight: var(--wm-fw-medium); font-size: var(--wm-fs-md); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cook .stage { flex: 1; display: grid; grid-template-columns: 1fr; position: relative; overflow: hidden; }
.cook .side { display: none; padding: var(--wm-s5); border-right: 1px solid var(--wm-line); overflow-y: auto; }
.cook .main { padding: var(--wm-s6) var(--wm-s5) var(--wm-s5); display: flex; flex-direction: column; justify-content: center; gap: var(--wm-s5); overflow-y: auto; }
.cook .stepno { color: var(--wm-accent); font-weight: var(--wm-fw-bold); font-size: var(--wm-fs-sm); letter-spacing: .06em; text-transform: uppercase; }
.cook .txt { font-size: var(--wm-fs-cook); line-height: 1.3; font-weight: var(--wm-fw-regular); }
.cook .tap { position: absolute; top: 0; bottom: 0; width: 22%; z-index: 2; }
.cook .tap.l { left: 0; } .cook .tap.r { right: 0; }
.cook .bottom { display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s3) var(--wm-s4) calc(var(--wm-s3) + env(safe-area-inset-bottom)); border-top: 1px solid var(--wm-line); }
.dots { flex: 1; display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.dots i { width: 8px; height: 8px; border-radius: 4px; background: var(--wm-border); opacity: .5; transition: width .2s; }
.dots i.on { width: 24px; background: var(--wm-accent); opacity: 1; }
.nav { width: 56px; height: 56px; border-radius: var(--wm-r-full); display: grid; place-items: center; box-shadow: inset 0 0 0 1px var(--wm-border); }
.nav.p { background: var(--wm-accent); color: var(--wm-on-accent); box-shadow: none; }
.nav[disabled] { opacity: .3; }
.timers { display: flex; gap: var(--wm-s2); flex-wrap: wrap; }
.tchip { display: inline-flex; align-items: center; gap: var(--wm-s2); min-height: 40px; padding: 0 14px; border-radius: var(--wm-r-full); background: var(--wm-surface2); font-weight: var(--wm-fw-medium); font-variant-numeric: tabular-nums; }
.tchip.done { background: var(--wm-attention); color: var(--wm-surface); animation: pulse 1s infinite; }
@keyframes pulse { 50% { opacity: .7; } }
.ing { list-style: none; padding: 0; margin: 0; }
.ing li + li { border-top: 1px solid var(--wm-line); }
.ing button { width: 100%; display: flex; gap: var(--wm-s3); align-items: center; padding: var(--wm-s3) var(--wm-s1); font-size: 18px; min-height: 52px; }
.ing button[aria-checked="true"] { color: var(--wm-text2); text-decoration: line-through; }
.pick { display: grid; gap: var(--wm-s2); }
.pick button { display: flex; align-items: center; gap: var(--wm-s3); padding: var(--wm-s3); border-radius: var(--wm-r-lg); background: var(--wm-surface); box-shadow: var(--wm-shadow-1), inset 0 0 0 1px var(--wm-edge); min-height: 72px; }
.pick .pthumb { width: 56px; height: 56px; flex: none; border-radius: var(--wm-r-md); background: var(--wm-surface2); overflow: hidden; display: grid; place-items: center; font-size: 26px; }
.pick .pthumb img { width: 100%; height: 100%; object-fit: cover; }
.pick button.now { box-shadow: inset 0 0 0 2px var(--wm-accent); }

/* ---------- toast ---------- */
.toast {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(var(--bar-h, 0px) + var(--wm-s4) + env(safe-area-inset-bottom));
  z-index: 30; max-width: min(560px, calc(100vw - 32px)); display: flex; align-items: center; gap: var(--wm-s4);
  padding: var(--wm-s3) var(--wm-s4); border-radius: var(--wm-r-md); background: var(--wm-toast); color: var(--wm-on-toast);
  box-shadow: var(--wm-shadow-2); font-size: var(--wm-fs-sm); animation: up .25s var(--wm-ease);
}
.toast button { color: var(--wm-toast-action); font-weight: var(--wm-fw-bold); white-space: nowrap; min-height: 32px; }

@media (min-width: 900px) {
  .weekgrid { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
  .cook .stage.split { grid-template-columns: minmax(280px, 32%) 1fr; }
  .cook .stage.split .side { display: block; }
  .cook .main { padding: var(--wm-s6) 56px var(--wm-s5); }
  .sheet { bottom: auto; top: 50%; transform: translateY(-50%); border-radius: var(--wm-r-lg); max-height: 84vh; animation: fade .2s; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
`;
