// Weekmenu panel — boodschappen, recepten en kookmodus voor Home Assistant.
// Vanilla web component (geen build-stap). Data via websocket "weekmenu/subscribe".

const IMG = (id) => `https://storefront-prod.nl.picnicinternational.com/static/images/${encodeURIComponent(id)}/small.png`;

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const eur = (n) =>
  n == null || isNaN(n) ? "" : "€" + Number(n).toFixed(2).replace(".", ",");

const GROUPS = [
  ["recipe", "Voor je recepten"],
  ["michelle", "Voor Michelle"],
  ["snack", "Snacks"],
  ["standard", "Vaste boodschappen"],
  ["promo", "Aanbiedingen"],
  ["advice", "Misschien bijna op"],
  ["extra", "Extra toegevoegd"],
];

const DAYS = { ma: "maandag", di: "dinsdag", wo: "woensdag", do: "donderdag", vr: "vrijdag", za: "zaterdag", zo: "zondag" };
const MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const cap = (t) => (t ? t[0].toUpperCase() + t.slice(1) : "");
const shortDate = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ""); return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]}` : ""; };
const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

const STATUS = {
  none: { label: "Nog geen voorstel", icon: "🗓️" },
  proposed: { label: "Voorstel klaar", icon: "📝" },
  approved: { label: "In je Picnic-mandje", icon: "🧺" },
};

const STYLE = `
:host { display:block; height:100%; --acc:#2f9e5b; --acc-soft:rgba(47,158,91,.12); --warn:#d9822b;
  --bg: var(--primary-background-color, #f6f7f5); --card: var(--card-background-color, #fff);
  --tx: var(--primary-text-color, #1d2320); --tx2: var(--secondary-text-color, #66706a);
  --line: var(--divider-color, rgba(0,0,0,.08)); --r:18px;
  font-family: var(--paper-font-body1_-_font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: var(--tx); background: var(--bg); -webkit-tap-highlight-color: transparent; }
* { box-sizing:border-box; }
button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; padding: 0; }
.app { display:flex; flex-direction:column; height:100%; }
header { display:flex; align-items:center; gap:8px; padding: max(8px, env(safe-area-inset-top)) 12px 8px; background: var(--app-header-background-color, var(--card)); color: var(--app-header-text-color, var(--tx)); border-bottom: 1px solid var(--line); }
header h1 { font-size:20px; font-weight:650; margin:0; flex:1; letter-spacing:-.01em; }
.tabs { display:flex; gap:4px; background: var(--bg); border-radius: 12px; padding: 3px; }
.tabs button { padding: 7px 14px; border-radius: 10px; font-weight:600; font-size:14px; color: var(--tx2); }
.tabs button.on { background: var(--card); color: var(--tx); box-shadow: 0 1px 3px rgba(0,0,0,.1); }
main { flex:1; overflow-y:auto; -webkit-overflow-scrolling: touch; padding: 16px 16px 120px; }
.wrap { max-width: 1100px; margin: 0 auto; }
.card { background: var(--card); border-radius: var(--r); padding: 16px; box-shadow: 0 1px 2px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04); }
.muted { color: var(--tx2); }
.small { font-size: 13px; }
h2 { font-size: 17px; margin: 24px 4px 10px; font-weight: 650; }
.pill { display:inline-flex; align-items:center; gap:4px; padding: 3px 9px; border-radius: 99px; font-size: 12px; font-weight: 600; background: var(--acc-soft); color: var(--acc); }
.pill.warn { background: rgba(217,130,43,.14); color: var(--warn); }
.btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding: 13px 18px; border-radius: 14px; font-weight: 650; background: var(--acc); color: #fff; min-height: 48px; transition: transform .1s, opacity .2s; }
.btn:active { transform: scale(.97); }
.btn.ghost { background: var(--acc-soft); color: var(--acc); }
.btn.sure { background: var(--warn); }
.btn[disabled] { opacity: .5; }
/* status */
.status { display:grid; gap: 12px; }
.status .big { font-size: 26px; font-weight: 700; letter-spacing: -.02em; }
.status .row { display:flex; gap: 16px; flex-wrap: wrap; align-items: baseline; }
.save { color: var(--acc); font-weight: 650; }
/* recipe carousel */
.carousel { display:flex; gap: 12px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 4px 12px; margin: 0 -4px; scrollbar-width: none; }
.carousel::-webkit-scrollbar { display:none; }
.rcard { scroll-snap-align: start; flex: 0 0 min(78%, 300px); background: var(--card); border-radius: var(--r); overflow:hidden; box-shadow: 0 1px 2px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.05); text-align:left; display:flex; flex-direction:column; }
.rcard .hero { height: 120px; display:flex; align-items:center; justify-content:center; font-size: 64px; background: linear-gradient(135deg, #fdf3e3, #e8f5ec); }
.rcard .body { padding: 12px 14px 14px; display:grid; gap: 6px; flex:1; }
.rcard .t { font-weight: 650; font-size: 16px; line-height: 1.25; }
.rcard .meta { display:flex; gap: 10px; font-size: 13px; color: var(--tx2); }
.rcard .go { margin-top: auto; padding-top: 6px; font-weight: 650; color: var(--acc); font-size: 14px; }
/* michelle */
.mcard { border: 2px solid var(--acc-soft); }
.opts { display:grid; gap: 8px; margin-top: 10px; }
.opt { display:flex; align-items:center; gap: 12px; padding: 12px; border-radius: 14px; background: var(--bg); text-align:left; }
.opt.on { background: var(--acc-soft); outline: 2px solid var(--acc); }
.opt .e { font-size: 28px; }
.opt .n { flex:1; font-weight: 600; }
.q { padding: 12px 0; border-top: 1px solid var(--line); }
.q:first-child { border-top: 0; padding-top: 0; }
.q .qt { font-weight: 650; margin-bottom: 8px; display:flex; gap: 8px; align-items: baseline; }
.q .qt span { font-weight: 500; color: var(--tx2); font-size: 13px; }
.chips { display:flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 9px 13px; border-radius: 99px; background: var(--bg); font-weight: 600; font-size: 14px; }
.chip.on { background: var(--acc); color: #fff; }
.chip .new { font-size: 11px; opacity: .75; margin-left: 4px; }
.own { display:flex; gap: 8px; margin-top: 8px; }
.own input { flex:1; min-width:0; font: inherit; font-size: 16px; padding: 9px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--card); color: var(--tx); outline: none; }
.own input:focus { border-color: var(--acc); }
.own button { padding: 0 14px; border-radius: 12px; background: var(--acc-soft); color: var(--acc); font-weight: 650; }
/* list */
.seg { display:flex; background: var(--card); border-radius: 12px; padding: 3px; margin-bottom: 12px; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
.seg button { flex:1; padding: 9px; border-radius: 10px; font-weight: 600; color: var(--tx2); }
.seg button.on { background: var(--acc); color: #fff; }
.add { display:flex; gap: 8px; margin-bottom: 8px; }
.add .btn { padding: 0 16px; white-space: nowrap; }
.add input { flex:1; min-width:0; font: inherit; font-size: 16px; padding: 12px 14px; border-radius: 14px; border: 1px solid var(--line); background: var(--card); color: var(--tx); outline: none; }
.add input:focus { border-color: var(--acc); }
.group { background: var(--card); border-radius: var(--r); overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.05); }
.gh { display:flex; justify-content: space-between; margin: 20px 6px 8px; font-weight: 650; font-size: 15px; }
.gh span:last-child { color: var(--tx2); font-weight: 500; font-size: 14px; }
.rowwrap { position: relative; overflow: hidden; border-bottom: 1px solid var(--line); background: var(--card); }
.rowwrap.drag { background: #e5484d; }
.rowwrap:last-child { border-bottom: 0; }
.rowwrap.drag::after { content: "Weg"; position:absolute; right: 18px; top: 50%; transform: translateY(-50%); color: #fff; font-weight: 650; }
.item { position: relative; z-index: 1; display:flex; align-items:center; gap: 12px; padding: 10px 12px; background: var(--card); touch-action: pan-y; transition: transform .2s; }
.item.dragging { transition: none; }
.thumb { width: 48px; height: 48px; border-radius: 10px; background: var(--bg); flex: 0 0 48px; display:flex; align-items:center; justify-content:center; overflow:hidden; font-size: 22px; }
.thumb img { width: 100%; height: 100%; object-fit: contain; }
.info { flex: 1; min-width: 0; }
.info .n { font-weight: 600; font-size: 15px; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; display:-webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.info .s { font-size: 12.5px; color: var(--tx2); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.info .promo { color: var(--acc); font-weight: 600; }
.step { display:flex; align-items:center; background: var(--bg); border-radius: 99px; }
.step button { width: 34px; height: 34px; border-radius: 99px; font-size: 18px; font-weight: 600; color: var(--acc); }
.step span { min-width: 18px; text-align:center; font-weight: 650; }
.price { width: 62px; text-align: right; font-weight: 600; font-size: 14px; }
.removed { margin-top: 16px; }
.removed summary { cursor: pointer; color: var(--tx2); font-weight: 600; padding: 8px 6px; list-style: none; }
.removed .r { display:flex; justify-content: space-between; align-items:center; padding: 8px 12px; color: var(--tx2); }
.removed .r button { color: var(--acc); font-weight: 600; }
.footer { position: fixed; left: var(--mdc-drawer-width, 0); right: 0; bottom: 0; padding: 10px 16px max(12px, env(safe-area-inset-bottom)); background: color-mix(in srgb, var(--card) 92%, transparent); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-top: 1px solid var(--line); display:flex; align-items:center; gap: 12px; z-index: 5; }
.footer .sum { flex:1; line-height: 1.25; }
.footer .sum b { font-size: 18px; }
.res-bad { color: #e5484d; font-weight: 600; }
/* cooking */
.cook { position: fixed; inset: 0; z-index: 20; background: var(--card); display:flex; flex-direction:column; }
.cook .top { display:flex; align-items:center; gap: 10px; padding: max(10px, env(safe-area-inset-top)) 14px 10px; border-bottom: 1px solid var(--line); }
.cook .top .t { flex: 1; font-weight: 650; font-size: 17px; }
.cook .x { width: 40px; height: 40px; border-radius: 99px; background: var(--bg); font-size: 20px; }
.cook .stage { flex:1; display:grid; grid-template-columns: 1fr; position: relative; overflow: hidden; }
.cook .side { display:none; padding: 22px; border-right: 1px solid var(--line); overflow-y: auto; }
.cook .main { padding: 28px 28px 20px; display:flex; flex-direction:column; justify-content:center; gap: 22px; overflow-y:auto; }
.cook .num { color: var(--acc); font-weight: 700; font-size: 15px; letter-spacing: .04em; text-transform: uppercase; }
.cook .txt { font-size: clamp(24px, 4.6vw, 40px); line-height: 1.3; font-weight: 550; letter-spacing: -.01em; }
.cook .tip { background: var(--acc-soft); border-radius: 14px; padding: 12px 14px; font-size: 16px; }
.cook .tap { position:absolute; top:0; bottom:0; width: 22%; z-index: 2; }
.cook .tap.l { left:0; } .cook .tap.r { right:0; }
.cook .bottom { display:flex; align-items:center; gap: 10px; padding: 10px 14px max(12px, env(safe-area-inset-bottom)); border-top: 1px solid var(--line); }
.dots { flex:1; display:flex; gap: 6px; justify-content:center; flex-wrap: wrap; }
.dots i { width: 8px; height: 8px; border-radius: 99px; background: var(--line); }
.dots i.on { background: var(--acc); width: 22px; }
.nav { width: 54px; height: 54px; border-radius: 99px; background: var(--bg); font-size: 22px; font-weight: 700; }
.nav.p { background: var(--acc); color: #fff; }
.timers { display:flex; gap: 8px; flex-wrap: wrap; }
.tchip { padding: 8px 12px; border-radius: 99px; background: var(--bg); font-weight: 650; font-variant-numeric: tabular-nums; }
.tchip.done { background: var(--warn); color: #fff; animation: pulse 1s infinite; }
@keyframes pulse { 50% { opacity: .6; } }
.ing { list-style: none; padding: 0; margin: 0; display:grid; gap: 4px; }
.ing li { display:flex; gap: 12px; align-items: center; padding: 10px 4px; font-size: 18px; border-bottom: 1px solid var(--line); }
.ing li.done { color: var(--tx2); text-decoration: line-through; }
.ing .box { width: 26px; height: 26px; border-radius: 8px; border: 2px solid var(--acc); flex: 0 0 26px; display:flex; align-items:center; justify-content:center; color:#fff; font-size: 16px; }
.ing li.done .box { background: var(--acc); }
.rate { display:flex; gap: 14px; justify-content:center; }
.rate button { font-size: 44px; width: 88px; height: 88px; border-radius: 24px; background: var(--bg); }
.rate button.on { background: var(--acc-soft); outline: 2px solid var(--acc); }
.pick { display:grid; gap: 10px; }
.pick button { display:flex; align-items:center; gap: 14px; padding: 14px; border-radius: 16px; background: var(--card); text-align:left; box-shadow: 0 1px 2px rgba(0,0,0,.06); }
.pick .e { font-size: 34px; }
.empty { text-align:center; padding: 48px 16px; color: var(--tx2); }
.empty .e { font-size: 52px; }
.toast { position: fixed; left: 50%; bottom: 96px; transform: translateX(-50%); background: #1d2320; color: #fff; border-radius: 14px; padding: 12px 16px; display:flex; gap: 16px; align-items:center; z-index: 30; box-shadow: 0 8px 24px rgba(0,0,0,.25); font-weight: 500; }
.toast button { color: #7fd6a1; font-weight: 700; }
/* days */
.wkhead { display:flex; align-items:flex-end; justify-content:space-between; gap: 12px; margin: 4px 4px 10px; }
.wkhead h2 { margin: 0; font-size: 20px; letter-spacing: -.01em; }
.wkhead .meta { font-size: 13px; color: var(--tx2); text-align: right; line-height: 1.35; }
.wkhead .meta b { color: var(--tx); font-weight: 650; }
.prog { display:flex; gap: 4px; margin: 0 4px 14px; }
.prog i { flex:1; height: 4px; border-radius: 99px; background: var(--line); }
.prog i.on { background: var(--acc); }
.prog i.none { background: var(--tx2); opacity: .45; }
.days { background: var(--card); border-radius: var(--r); overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,.05), 0 4px 16px rgba(0,0,0,.04); }
.day { border-top: 1px solid var(--line); }
.day:first-child { border-top: 0; }
.dhead { width: 100%; display:flex; align-items:center; gap: 14px; padding: 12px 14px; text-align:left; min-height: 68px; }
.day.past .dhead { opacity: .45; }
.dtile { width: 46px; flex: 0 0 46px; height: 50px; border-radius: 12px; background: var(--bg); display:flex; flex-direction:column; align-items:center; justify-content:center; line-height: 1; }
.dtile small { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--tx2); }
.dtile b { font-size: 19px; font-weight: 700; margin-top: 3px; font-variant-numeric: tabular-nums; }
.day.today .dtile { background: var(--acc); color: #fff; }
.day.today .dtile small { color: rgba(255,255,255,.85); }
.dmid { flex:1; min-width:0; display:grid; gap: 2px; }
.dslot { font-size: 11.5px; font-weight: 650; letter-spacing: .05em; text-transform: uppercase; color: var(--tx2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dmain { display:flex; align-items:center; gap: 8px; min-width: 0; font-size: 15.5px; font-weight: 600; }
.dmain .tt { min-width:0; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
.dmain.open { color: var(--tx2); font-weight: 500; }
.dmain.open::before { content: ""; width: 7px; height: 7px; border-radius: 99px; background: var(--warn); flex: 0 0 7px; }
.dmain.none { color: var(--tx2); font-weight: 500; }
.dnote { font-size: 12.5px; color: var(--tx2); line-height: 1.35; }
.dright { display:flex; align-items:center; gap: 6px; color: var(--tx2); font-size: 14px; font-variant-numeric: tabular-nums; }
.chev { width: 18px; height: 18px; transition: transform .2s; opacity: .6; }
.day.open .chev { transform: rotate(90deg); }
.strip { display:flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 2px 14px 12px; scrollbar-width: none; scroll-padding: 0 14px; }
.strip::-webkit-scrollbar { display:none; }
.ocard { scroll-snap-align: start; flex: 0 0 min(86%, 340px); border-radius: 16px; background: var(--bg); border: 1.5px solid var(--line); display:flex; flex-direction:column; padding: 14px; gap: 12px; position: relative; }
.ocard.on { border-color: var(--acc); box-shadow: 0 0 0 1px var(--acc) inset; }
.ocard .badge { position:absolute; top: 12px; right: 12px; background: var(--acc); color:#fff; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 99px; }
.ohead { display:flex; gap: 12px; align-items:flex-start; padding-right: 0; }
.oemoji { width: 48px; height: 48px; flex: 0 0 48px; border-radius: 12px; background: var(--card); display:flex; align-items:center; justify-content:center; font-size: 26px; }
.otitle { font-weight: 650; font-size: 15.5px; line-height: 1.3; }
.ometa { font-size: 13px; color: var(--tx2); margin-top: 3px; display:flex; gap: 6px; flex-wrap: wrap; align-items:center; }
.ometa .dot::before { content: "·"; margin-right: 6px; }
.otag { display:inline-block; font-size: 12px; font-weight: 650; color: var(--acc); background: var(--acc-soft); padding: 2px 8px; border-radius: 6px; }
.ings { margin: 0; padding: 0; list-style: none; font-size: 13.5px; display:grid; gap: 5px; }
.ings li { display:flex; gap: 8px; align-items: baseline; min-width: 0; }
.ings .q { color: var(--tx2); font-variant-numeric: tabular-nums; }
.ings .n { flex:1; min-width:0; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
.ings .p { font-size: 11.5px; font-weight: 650; color: var(--acc); white-space: nowrap; }
.ings .more { color: var(--tx2); }
.prep { font-size: 13.5px; display:grid; gap: 8px; border-top: 1px solid var(--line); padding-top: 10px; }
.prep ol { margin: 0; padding-left: 18px; display:grid; gap: 5px; line-height: 1.4; }
.prep .tip { background: var(--acc-soft); border-radius: 10px; padding: 8px 10px; }
.ofoot { display:grid; gap: 4px; margin-top: auto; }
.ofoot .linkbtn { justify-self: start; color: var(--acc); font-weight: 600; font-size: 13.5px; padding: 4px 0 8px; }
.ofoot .btn { width: 100%; min-height: 44px; padding: 10px 14px; font-size: 15px; border-radius: 12px; }
.ocard.on .ofoot .btn { background: transparent; color: var(--acc); border: 1.5px solid var(--acc); }
.ocard.nocook .oemoji { opacity: .8; }
.sdots { display:flex; gap: 5px; justify-content:center; padding: 0 0 14px; }
.sdots i { width: 6px; height: 6px; border-radius: 99px; background: var(--line); transition: width .2s, background .2s; }
.sdots i.on { background: var(--tx2); width: 16px; }
.sdots i.ch { background: var(--acc); }
.sdots i.ch.on { background: var(--acc); }
.warnline { color: var(--warn); font-weight: 600; font-size: 13.5px; }
.weekgrid { display:grid; gap: 22px; align-items: start; }
.weekgrid > div { min-width: 0; }
.sugg { background: var(--card); border-radius: 14px; box-shadow: 0 6px 24px rgba(0,0,0,.14); overflow: hidden; margin: -2px 0 10px; border: 1px solid var(--line); }
.sugg button { width: 100%; display:flex; align-items:center; gap: 12px; padding: 9px 12px; text-align:left; border-top: 1px solid var(--line); }
.sugg button:first-child { border-top: 0; }
.sugg .thumb { width: 40px; height: 40px; flex: 0 0 40px; font-size: 18px; }
.sugg .sn { flex:1; min-width:0; }
.sugg .sn b { display:block; font-weight: 600; font-size: 14.5px; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
.sugg .sn span { font-size: 12.5px; color: var(--tx2); }
.sugg .plus { width: 32px; height: 32px; border-radius: 99px; background: var(--acc-soft); color: var(--acc); display:flex; align-items:center; justify-content:center; font-size: 20px; font-weight: 600; flex: 0 0 32px; }
.sugg .hint { padding: 10px 12px; font-size: 13px; color: var(--tx2); }
.statusline { font-size: 13px; color: var(--tx2); }
.sheetbg { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 15; }
.sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 16; max-height: 86vh; overflow-y: auto; background: var(--card); border-radius: 20px 20px 0 0; padding: 10px 18px max(18px, env(safe-area-inset-bottom)); box-shadow: 0 -8px 30px rgba(0,0,0,.25); max-width: 640px; margin: 0 auto; }
.sheet .grab { width: 40px; height: 5px; border-radius: 99px; background: var(--line); margin: 0 auto 12px; }
.sheet h3 { margin: 0; font-size: 19px; line-height: 1.3; }
.sheet .sec { font-size: 12px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--tx2); margin: 18px 0 8px; }
.sheet ol { margin: 0; padding-left: 20px; display:grid; gap: 8px; line-height: 1.45; font-size: 15px; }
.sheet .tip { background: var(--acc-soft); border-radius: 12px; padding: 10px 12px; font-size: 14px; margin-top: 8px; }
.sheet .acts { display:flex; gap: 10px; margin-top: 20px; }
.sheet .acts .btn { flex: 1; white-space: nowrap; }
.sheet .acts .btn:last-child { flex: 2; }
@media (min-width: 900px) {
  .weekgrid { grid-template-columns: 1.1fr 1fr; gap: 24px; }
  .weekgrid h2:first-child { margin-top: 0; }
  .cook .stage.split { grid-template-columns: minmax(260px, 32%) 1fr; }
  .cook .stage.split .side { display:block; }
  .cook .main { padding: 40px 56px 24px; }
}
`;

class WeekmenuPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.ui = { tab: "week", seg: "week", cook: null, step: -1, checked: {}, sure: false, busy: false, rating: null };
    this.timers = [];
    this.data = null;
    this._wake = null;
    this._tick = null;
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._connect();
  }
  get hass() { return this._hass; }
  set narrow(v) { this._narrow = v; this._menu && (this._menu.narrow = v); }
  set panel(p) { this._panel = p; }

  connectedCallback() {
    if (this._hass && !this._unsub) this._connect();
    this._render();
  }

  disconnectedCallback() {
    if (this._unsub) { this._unsub.then((u) => u()).catch(() => {}); this._unsub = null; }
    clearInterval(this._tick);
    this._releaseWake();
  }

  _connect() {
    if (this._unsub || !this._hass) return;
    this._unsub = this._hass.connection.subscribeMessage(
      (data) => { this.data = data; this._render(); },
      { type: "weekmenu/subscribe" }
    );
    this._unsub.catch((e) => { this._error = e.message || String(e); this._render(); });
    this._ensureSidebar();
  }

  // Eenmalig per gebruiker: Weekmenu als 2e item in de zijbalk (na het hoofddashboard).
  async _ensureSidebar() {
    const ws = (m) => this._hass.connection.sendMessagePromise(m);
    try {
      const flag = await ws({ type: "frontend/get_user_data", key: "weekmenu_sidebar" });
      if (flag?.value?.done) return;
      const cur = (await ws({ type: "frontend/get_user_data", key: "sidebar" }))?.value || {};
      let def = "lovelace";
      try { def = (await ws({ type: "frontend/get_system_data", key: "core" }))?.value?.default_panel || def; } catch (_) {}
      const rest = (cur.panelOrder || []).filter((p) => p !== "weekmenu" && p !== def);
      await ws({
        type: "frontend/set_user_data",
        key: "sidebar",
        value: { ...cur, panelOrder: [def, "weekmenu", ...rest], hiddenPanels: (cur.hiddenPanels || []).filter((p) => p !== "weekmenu") },
      });
      await ws({ type: "frontend/set_user_data", key: "weekmenu_sidebar", value: { done: true } });
    } catch (e) {
      console.warn("Weekmenu: zijbalk niet aangepast", e);
    }
  }

  async _ws(msg) {
    try {
      return await this._hass.connection.sendMessagePromise(msg);
    } catch (e) {
      this._toast(e.message || "Dat lukte niet");
      throw e;
    }
  }

  // ---------- helpers ----------
  get plan() { return this.data?.plan || null; }
  _items() { return this.data?.view?.items || this.plan?.items || []; }
  get days() { return this.plan?.days || null; }
  _sum() { return this.data?.view?.summary || null; }
  _recipeById(id) { return (this.plan?.recipes || []).find((r) => r.id === id); }
  _active() { return this._items().filter((i) => !i.removed && i.qty > 0); }
  _totals() {
    let sum = 0, save = 0, unknown = 0;
    for (const i of this._active()) {
      if (i.unit_price != null) sum += i.unit_price * i.qty; else unknown++;
      if (i.promo?.saving) save += Number(i.promo.saving) * (i.promo.per_unit ? i.qty : 1);
    }
    return { sum, save, count: this._active().length, unknown };
  }
  _thumb(i) {
    return i.image_id
      ? `<div class="thumb"><img loading="lazy" src="${IMG(i.image_id)}" alt="" onerror="this.replaceWith(document.createTextNode('🛒'))"></div>`
      : `<div class="thumb">${esc(i.emoji || "🛒")}</div>`;
  }

  _suggList(field) {
    const sg = this.sugg;
    if (!sg || sg.field !== field) return "";
    if (sg.loading && !sg.items.length) return `<div class="sugg"><div class="hint">Zoeken…</div></div>`;
    if (!sg.items.length) return `<div class="sugg"><div class="hint">Niets gevonden. Druk op ＋ om "${esc(sg.q)}" toch toe te voegen.</div></div>`;
    return `<div class="sugg">${sg.items.map((it, k) => `<button data-a="pick" data-f="${esc(field)}" data-i="${k}">
      ${this._thumb(it)}<span class="sn"><b>${esc(it.name)}</b><span>${[it.unit, it.unit_price != null ? eur(it.unit_price) : ""].filter(Boolean).map(esc).join(" · ")}</span></span>
      <span class="plus">＋</span></button>`).join("")}</div>`;
  }

  _onSearchInput(field, value) {
    clearTimeout(this._sugT);
    const q = (value || "").trim();
    if (q.length < 2) { if (this.sugg) { this.sugg = null; this._render(); } return; }
    this._sugT = setTimeout(async () => {
      this.sugg = { field, q, items: this.sugg?.field === field ? this.sugg.items : [], loading: true };
      this._render();
      try {
        const r = await this._hass.connection.sendMessagePromise({ type: "weekmenu/search", query: q });
        const cur = this.shadowRoot.getElementById(field)?.value.trim();
        if (cur !== q) return; // al verder getypt
        this.sugg = { field, q, items: r.results || [], loading: false };
      } catch (_) {
        this.sugg = null;
      }
      this._render();
    }, 280);
  }

  _toast(text, undo) {
    this._toastData = { text, undo };
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => { this._toastData = null; this._render(); }, undo ? 5000 : 3000);
    this._render();
  }

  // ---------- render ----------
  _render() {
    const root = this.shadowRoot;
    const main = root.querySelector("main");
    const scroll = main ? main.scrollTop : 0;
    const car = root.querySelector(".carousel");
    const carScroll = car ? car.scrollLeft : 0;
    const strip = root.querySelector(".strip");
    const stripScroll = strip ? { day: strip.dataset.day, x: strip.scrollLeft } : null;
    const focused = root.activeElement?.id;
    const focusVal = focused ? root.getElementById(focused)?.value : null;

    root.innerHTML = `<style>${STYLE}</style>
      <div class="app">
        <header>
          <span class="menu"></span>
          <h1>Weekmenu</h1>
          <div class="tabs">
            ${[["week", "Week"], ["cook", "Koken"], ["list", "Lijst"]]
              .map(([k, l]) => `<button data-a="tab" data-v="${k}" class="${this.ui.tab === k ? "on" : ""}">${l}</button>`).join("")}
          </div>
        </header>
        <main><div class="wrap">${this._body()}</div></main>
        ${this._footer()}
        ${this.ui.prep && !this.ui.cook ? this._prepSheet() : ""}
        ${this.ui.cook ? this._cookView() : ""}
        ${this._toastData ? `<div class="toast"><span>${esc(this._toastData.text)}</span>${this._toastData.undo ? `<button data-a="undo">Ongedaan</button>` : ""}</div>` : ""}
      </div>`;

    // HA menu button (sidebar) on narrow screens
    if (customElements.get("ha-menu-button")) {
      this._menu = document.createElement("ha-menu-button");
      this._menu.hass = this._hass;
      this._menu.narrow = this._narrow;
      root.querySelector(".menu").appendChild(this._menu);
    }

    const m2 = root.querySelector("main");
    if (m2) m2.scrollTop = scroll;
    const c2 = root.querySelector(".carousel");
    if (c2) c2.scrollLeft = carScroll;
    const s2 = root.querySelector(".strip");
    if (s2) {
      if (this.ui.jump) {
        // just opened: show the chosen option
        const on = s2.querySelector(".ocard.on");
        s2.scrollLeft = on ? on.offsetLeft - 14 : 0;
        this.ui.jump = false;
      } else if (stripScroll && stripScroll.day === s2.dataset.day) s2.scrollLeft = stripScroll.x;
      this._stripDots(s2);
    }
    if (focused) {
      const el = root.getElementById(focused);
      if (el) { el.value = focusVal ?? ""; el.focus(); }
    }
    this._bind();
  }

  _body() {
    if (this._error) return `<div class="empty"><div class="e">⚠️</div><p>${esc(this._error)}</p></div>`;
    if (!this.data) return `<div class="empty"><div class="e">🥕</div><p>Laden…</p></div>`;
    if (this.ui.tab === "list") return this._listView();
    if (this.ui.tab === "cook") return this._cookPick();
    return this._weekView();
  }

  _weekView() {
    const p = this.plan;
    if (!p) return `<div class="empty"><div class="e">🗓️</div><p>Nog geen weekvoorstel.<br>Vrijdagochtend staat het klaar.</p></div>`;
    const st = STATUS[p.status] || STATUS.proposed;
    const t = this._totals();
    const recipes = p.recipes || [];
    const fails = (p.results || []).filter((r) => !r.ok).length;
    if (this.days?.length) return this._weekDaysView(p, st, t, fails);
    return `
      <div class="weekgrid">
        <div>
          <div class="card status">
            <div class="row"><span class="pill ${p.status === "approved" ? "" : "warn"}">${st.icon} ${st.label}</span>
              ${p.delivery ? `<span class="muted small">Bezorging ${esc(p.delivery)}</span>` : ""}</div>
            <div class="row"><span class="big">${eur(t.sum)}</span>
              <span class="muted">${t.count} producten</span>
              ${t.save > 0 ? `<span class="save">${eur(t.save)} voordeel</span>` : ""}</div>
            ${p.advice ? `<div class="small">💡 ${esc(p.advice)}</div>` : ""}
            ${p.status === "approved"
              ? `<div class="small">Kies het bezorgmoment en reken af in de Picnic-app.${fails ? ` <span class="res-bad">${fails} product${fails > 1 ? "en" : ""} niet gelukt.</span>` : ""}</div>
                 <button class="btn ghost" data-a="reopen">Toch nog iets aanpassen</button>`
              : `<div class="row"><button class="btn" data-a="tab" data-v="list">Bekijk lijst</button>${this._approveBtn()}</div>
                 ${p.order_deadline ? `<div class="muted small">Bestellen kan tot ${esc(p.order_deadline)}</div>` : ""}`}
          </div>
          ${this._michelleCard()}
          ${this._questionsCard()}
        </div>
        <div>
          <h2>Recepten deze week</h2>
          ${recipes.length ? `<div class="carousel">${recipes.map((r) => this._rcard(r)).join("")}</div>`
            : `<div class="card muted">Geen recepten deze week.</div>`}
        </div>
      </div>`;
  }

  _openDaysWarn() {
    const n = (this._sum()?.days_open || []).length;
    return n ? `<div class="warnline">${n} ${n === 1 ? "dag" : "dagen"} nog open</div>` : "";
  }

  _weekDaysView(p, st, t, fails) {
    const sm = this._sum() || {};
    return `
      <div class="weekgrid">
        <div>
          <div class="wkhead"><h2>Deze week</h2>
            <div class="meta"><b>${sm.days_chosen || 0}/${sm.days_total || this.days.length}</b> gekozen${sm.recipe_price ? ` · ca. ${eur(sm.recipe_price)}` : ""}</div></div>
          <div class="prog">${this.days.map((d) => `<i class="${d.choice === "none" ? "none" : d.choice ? "on" : ""}"></i>`).join("")}</div>
          <div class="days">${this.days.map((d) => this._dayRow(d)).join("")}</div>
        </div>
        <div>
          <div class="card status">
            <div class="row"><span class="big">${eur(t.sum)}</span>
              <span class="muted">${t.count} producten</span>
              ${t.save > 0 ? `<span class="save">${eur(t.save)} voordeel</span>` : ""}</div>
            ${p.status === "approved"
              ? `<div class="small">🧺 In je Picnic-mandje. Kies het bezorgmoment in de Picnic-app.${fails ? ` <span class="res-bad">${fails} niet gelukt.</span>` : ""}</div>
                 <button class="btn ghost" data-a="reopen">Toch nog iets aanpassen</button>`
              : `${this._openDaysWarn()}
                 <div class="row"><button class="btn ghost" data-a="tab" data-v="list">Lijst</button>${this._approveBtn()}</div>`}
            ${[p.delivery ? `Bezorging ${esc(p.delivery)}` : "", p.status !== "approved" && p.order_deadline ? `bestellen tot ${esc(p.order_deadline)}` : ""].filter(Boolean).length
              ? `<div class="statusline">${[p.delivery ? `Bezorging ${esc(p.delivery)}` : "", p.status !== "approved" && p.order_deadline ? `bestellen tot ${esc(p.order_deadline)}` : ""].filter(Boolean).join(" · ")}</div>` : ""}
          </div>
          ${this._michelleCard()}
          ${this._questionsCard()}
        </div>
      </div>`;
  }

  _dayRow(d) {
    const today = todayIso();
    const open = this.ui.openDay === d.day;
    const cls = ["day", open ? "open" : "", d.date === today ? "today" : "", d.date && d.date < today ? "past" : ""].join(" ");
    const r = d.choice && d.choice !== "none" ? this._recipeById(d.choice) : null;
    const dayNum = /^\d{4}-\d{2}-(\d{2})/.exec(d.date || "")?.[1];
    const main = r
      ? `<div class="dmain"><span>${esc(r.emoji || "🍽️")}</span><span class="tt">${esc(r.title)}</span></div>`
      : d.choice === "none"
        ? `<div class="dmain none"><span class="tt">Niets koken</span></div>`
        : `<div class="dmain open"><span class="tt">Nog kiezen</span></div>`;
    const slot = d.slot || "";
    const chev = `<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>`;
    const head = `<button class="dhead" data-a="day" data-v="${esc(d.day)}" aria-expanded="${open}">
      <div class="dtile"><small>${esc(d.day)}</small><b>${dayNum ? Number(dayNum) : ""}</b></div>
      <div class="dmid">${slot ? `<div class="dslot">${esc(slot)}</div>` : ""}${main}${d.note ? `<div class="dnote">${esc(d.note)}</div>` : ""}</div>
      <div class="dright">${r?.price != null ? eur(r.price) : ""}${chev}</div></button>`;
    if (!open) return `<div class="${cls}">${head}</div>`;
    const cards = [...(d.options || []).map((id) => this._optionCard(d, this._recipeById(id))).filter(Boolean), this._noneCard(d)];
    const chosenIdx = d.choice === "none" ? cards.length - 1 : Math.max(0, (d.options || []).indexOf(d.choice));
    return `<div class="${cls}">${head}
      <div class="strip" data-day="${esc(d.day)}">${cards.join("")}</div>
      <div class="sdots" data-day="${esc(d.day)}">${cards.map((_, k) => `<i class="${k === chosenIdx ? "on" : ""}"></i>`).join("")}</div></div>`;
  }

  _recipeIngredients(r, max = 4) {
    const items = (this.plan?.items || []).filter((i) => i.recipe_id === r.id && i.source === "recipe");
    const rows = items.length
      ? items.map((i) => `<li>${i.qty > 1 ? `<span class="q">${i.qty}×</span>` : ""}<span class="n">${esc(i.name)}</span>${i.promo?.label ? `<span class="p">${esc(i.promo.label)}</span>` : ""}</li>`)
      : (r.ingredients || []).map((x) => `<li><span class="n">${esc(typeof x === "string" ? x : x.text || x.name)}</span></li>`);
    const extra = rows.length - max;
    return rows.slice(0, extra > 1 ? max : rows.length).join("") + (extra > 1 ? `<li class="more">+ ${extra} meer</li>` : "");
  }

  _optionCard(d, r) {
    if (!r) return "";
    const on = d.choice === r.id;
    const takenOn = !on && (this.days || []).find((x) => x.choice === r.id);
    const prepKey = `${d.day}:${r.id}`;
    const steps = r.steps || [];
    const tips = [r.tips?.michelle ? `Michelle: ${esc(r.tips.michelle)}` : "", r.tips?.kai ? `Kai: ${esc(r.tips.kai)}` : ""].filter(Boolean);
    const meta = [r.minutes ? `${r.minutes} min` : "", r.price != null ? eur(r.price) : "", takenOn ? `nu op ${esc(DAYS[takenOn.day] || takenOn.day)}` : ""].filter(Boolean);
    return `<div class="ocard ${on ? "on" : ""}">
      <div class="ohead"><div class="oemoji">${esc(r.emoji || "🍽️")}</div>
        <div><div class="otitle">${esc(r.title)}</div>
          <div class="ometa">${meta.map((m, k) => `<span class="${k ? "dot" : ""}">${m}</span>`).join("")}</div></div></div>
      ${r.why ? `<div><span class="otag">${esc(r.why)}</span></div>` : ""}
      ${(() => { const li = this._recipeIngredients(r, 4); return li ? `<ul class="ings">${li}</ul>` : ""; })()}
      <div class="ofoot">
        ${steps.length || tips.length ? `<button class="linkbtn" data-a="prep" data-v="${esc(prepKey)}">Bereiding bekijken</button>` : ""}
        <button class="btn" data-a="choose" data-d="${esc(d.day)}" data-v="${esc(r.id)}">${on ? `✓ Gekozen voor ${esc(DAYS[d.day] || d.day)}` : "Kies dit"}</button>
      </div></div>`;
  }

  _prepSheet() {
    const [dk, rid] = String(this.ui.prep || "").split(":");
    const d = (this.days || []).find((x) => x.day === dk);
    const r = this._recipeById(rid);
    if (!d || !r) return "";
    const on = d.choice === r.id;
    const tips = [r.tips?.michelle ? `<b>Michelle</b> · ${esc(r.tips.michelle)}` : "", r.tips?.kai ? `<b>Kai</b> · ${esc(r.tips.kai)}` : ""].filter(Boolean);
    const meta = [r.minutes ? `${r.minutes} min` : "", r.servings ? esc(r.servings) : "", r.price != null ? eur(r.price) : ""].filter(Boolean).join(" · ");
    return `<div class="sheetbg" data-a="prep" data-v=""></div>
      <div class="sheet" role="dialog" aria-label="${esc(r.title)}">
        <div class="grab"></div>
        <div class="ohead"><div class="oemoji" style="background:var(--bg)">${esc(r.emoji || "🍽️")}</div>
          <div><h3>${esc(r.title)}</h3><div class="ometa">${meta}</div></div></div>
        ${r.why ? `<div style="margin-top:10px"><span class="otag">${esc(r.why)}</span></div>` : ""}
        <div class="sec">Ingrediënten</div><ul class="ings">${this._recipeIngredients(r, 99)}</ul>
        ${(r.pantry || []).length ? `<div class="muted small" style="margin-top:6px">Uit de kast: ${esc(r.pantry.join(", "))}</div>` : ""}
        ${(r.steps || []).length ? `<div class="sec">Bereiding</div><ol>${r.steps.map((s) => `<li>${esc(s.text)}</li>`).join("")}</ol>` : ""}
        ${tips.map((t) => `<div class="tip">${t}</div>`).join("")}
        <div class="acts"><button class="btn ghost" data-a="prep" data-v="">Sluiten</button>
          <button class="btn" data-a="choose" data-d="${esc(d.day)}" data-v="${esc(r.id)}">${on ? `✓ Gekozen voor ${esc(DAYS[d.day] || d.day)}` : `Kies voor ${esc(DAYS[d.day] || d.day)}`}</button></div>
      </div>`;
  }

  _noneCard(d) {
    const on = d.choice === "none";
    return `<div class="ocard nocook ${on ? "on" : ""}">
      <div class="ohead"><div class="oemoji">🚫</div>
        <div><div class="otitle">Niets koken</div><div class="ometa"><span>Uit eten, restjes of bij opa en oma</span></div></div></div>
      <div class="ofoot"><button class="btn" data-a="choose" data-d="${esc(d.day)}" data-v="none">${on ? `✓ Gekozen voor ${esc(DAYS[d.day] || d.day)}` : "Kies dit"}</button></div>
    </div>`;
  }

  _rcard(r) {
    return `<button class="rcard" data-a="cook" data-v="${esc(r.id)}">
      <div class="hero">${esc(r.emoji || "🍽️")}</div>
      <div class="body">
        <div class="t">${esc(r.title)}</div>
        <div class="meta">${r.minutes ? `<span>⏱ ${r.minutes} min</span>` : ""}${r.price != null ? `<span>${eur(r.price)}</span>` : ""}${r.day ? `<span>${esc(r.day)}</span>` : ""}</div>
        ${r.why ? `<div><span class="pill">🏷️ ${esc(r.why)}</span></div>` : ""}
        <div class="go">Start koken →</div>
      </div></button>`;
  }

  _michelleCard() {
    const m = this.plan?.michelle;
    if (!m || !(m.options || []).length) return "";
    return `<h2>Michelle ${esc(m.day_label || "")}</h2>
      <div class="card mcard">
        <div>${esc(m.question || "Late dienst — wat neem je mee?")}</div>
        <div class="opts">${m.options.map((o) => `
          <button class="opt ${m.choice === o.id ? "on" : ""}" data-a="mchoose" data-v="${esc(o.id)}">
            <span class="e">${esc(o.emoji || "🥗")}</span><span class="n">${esc(o.title)}</span>
            <span class="muted small">${o.price ? eur(o.price) : ""}</span></button>`).join("")}
        </div>
        ${m.choice ? "" : `<div class="muted small" style="margin-top:8px">Wacht op Michelle</div>`}
      </div>`;
  }

  _questionsCard() {
    const qs = this.plan?.questions || [];
    if (!qs.length) return "";
    const who = { kai: "👦", michelle: "👩", ruben: "🧔" };
    return `<h2>Snacks deze week</h2><div class="card">${qs.map((q) => `
      <div class="q">
        <div class="qt">${who[q.who] || "🍎"} ${esc(q.title)}${q.question ? `<span>${esc(q.question)}</span>` : ""}</div>
        <div class="chips">${(q.options || []).map((o) => `
          <button class="chip ${q.choice === o.id ? "on" : ""}" data-a="answer" data-q="${esc(q.id)}" data-v="${esc(o.id)}">${esc(o.emoji || "")} ${esc(o.title)}${o.learned ? "" : o.new ? `<span class="new">nieuw</span>` : ""}</button>`).join("")}
          ${q.choice === "custom" ? `<button class="chip on" data-a="answer" data-q="${esc(q.id)}" data-v="">✍️ ${esc(q.custom)}</button>` : ""}
        </div>
        <div class="own"><input id="own-${esc(q.id)}" placeholder="Iets anders zoeken" enterkeyhint="done" autocomplete="off"><button data-a="own" data-q="${esc(q.id)}">Kies</button></div>${this._suggList(`own-${q.id}`)}
      </div>`).join("")}</div>`;
  }

  _approveBtn() {
    if (this.ui.busy) return `<button class="btn" disabled>Bezig…</button>`;
    return this.ui.sure
      ? `<button class="btn sure" data-a="approve">Zeker? Tik nogmaals</button>`
      : `<button class="btn" data-a="approve">Akkoord, vul mandje</button>`;
  }

  _footer() {
    if (!this.data || this.ui.tab !== "list" || this.ui.seg !== "week" || !this.plan || this.plan.status === "approved") return "";
    const t = this._totals();
    return `<div class="footer"><div class="sum"><b>${eur(t.sum)}</b><br><span class="muted small">${t.count} producten${t.save > 0 ? ` · <span class="save">${eur(t.save)} voordeel</span>` : ""}</span></div>${this._approveBtn()}</div>`;
  }

  _listView() {
    const seg = `<div class="seg">
      <button data-a="seg" data-v="week" class="${this.ui.seg === "week" ? "on" : ""}">Deze week</button>
      <button data-a="seg" data-v="std" class="${this.ui.seg === "std" ? "on" : ""}">Altijd</button></div>`;
    if (this.ui.seg === "std") return seg + this._stdView();
    const p = this.plan;
    if (!p) return seg + `<div class="empty"><div class="e">🛒</div><p>Nog geen lijst deze week.</p></div>`;
    const locked = p.status === "approved";
    const active = this._active();
    const groups = GROUPS.map(([src, label]) => {
      const items = active.filter((i) => (i.source || "extra") === src);
      if (!items.length) return "";
      const sub = items.reduce((s, i) => s + (i.unit_price || 0) * i.qty, 0);
      return `<div class="gh"><span>${label}</span><span>${eur(sub)}</span></div>
        <div class="group">${items.map((i) => this._row(i, locked)).join("")}</div>`;
    }).join("");
    const other = active.filter((i) => !GROUPS.some(([s]) => s === (i.source || "extra")));
    const removed = this._items().filter((i) => i.removed || i.qty === 0);
    return seg +
      (locked ? `<div class="card small">🧺 Deze lijst staat in je Picnic-mandje. <button style="color:var(--acc);font-weight:600" data-a="reopen">Aanpassen</button></div>`
        : `<div class="add"><input id="addweek" placeholder="Zoek een product" enterkeyhint="done" autocomplete="off"><button class="btn" data-a="addweek">＋</button></div>${this._suggList("addweek")}`) +
      groups +
      (other.length ? `<div class="gh"><span>Overig</span></div><div class="group">${other.map((i) => this._row(i, locked)).join("")}</div>` : "") +
      (removed.length && !locked ? `<details class="removed"><summary>Weggehaald (${removed.length})</summary><div class="group">${removed
        .map((i) => `<div class="r"><span>${esc(i.name)}</span><button data-a="restore" data-v="${esc(i.key)}">Terugzetten</button></div>`).join("")}</div></details>` : "");
  }

  _row(i, locked) {
    const promo = i.promo?.label ? `<span class="promo">🏷️ ${esc(i.promo.label)}</span>` : "";
    const sub = [promo, i.recipe ? esc(i.recipe) : "", i.note ? `💡 ${esc(i.note)}` : "", i.unit ? esc(i.unit) : ""].filter(Boolean).join(" · ");
    return `<div class="rowwrap"><div class="item" data-key="${esc(i.key)}">
      ${this._thumb(i)}
      <div class="info"><div class="n">${esc(i.name)}</div>${sub ? `<div class="s">${sub}</div>` : ""}</div>
      ${locked ? `<span class="muted">${i.qty}×</span>` : `<div class="step"><button data-a="minus" data-v="${esc(i.key)}" aria-label="minder">−</button><span>${i.qty}</span><button data-a="plus" data-v="${esc(i.key)}" aria-label="meer">+</button></div>`}
      <div class="price">${i.unit_price != null ? eur(i.unit_price * i.qty) : ""}</div>
    </div></div>`;
  }

  _stdView() {
    const std = this.data.standard_items || [];
    return `<div class="muted small" style="margin:0 6px 10px">Dit komt elke week standaard op je lijst.</div>
      <div class="add"><input id="addstd" placeholder="Zoek een vast product" enterkeyhint="done" autocomplete="off"><button class="btn" data-a="addstd">＋</button></div>${this._suggList("addstd")}
      ${std.length ? `<div class="group">${std.map((i) => `<div class="rowwrap"><div class="item" data-std="${esc(i.key)}">
        ${this._thumb(i)}<div class="info"><div class="n">${esc(i.name)}</div>${i.unit ? `<div class="s">${esc(i.unit)}</div>` : ""}</div>
        <div class="step"><button data-a="sminus" data-v="${esc(i.key)}">−</button><span>${i.qty}</span><button data-a="splus" data-v="${esc(i.key)}">+</button></div>
      </div></div>`).join("")}</div>` : `<div class="empty"><div class="e">📋</div><p>Nog geen vaste producten.</p></div>`}`;
  }

  // ---------- cooking ----------
  _cookRecipes() {
    if (!this.days?.length) return (this.plan?.recipes || []).map((r) => ({ r, day: null }));
    return this.days.filter((d) => d.choice && d.choice !== "none").map((d) => ({ r: this._recipeById(d.choice), day: d.day })).filter((x) => x.r);
  }

  _cookPick() {
    const list = this._cookRecipes();
    if (this.days?.length && !list.length) return `<div class="empty"><div class="e">👩‍🍳</div><p>Nog geen recepten gekozen.<br>Kies per dag in het tabblad Week.</p></div>`;
    const recipes = list.map((x) => ({ ...x.r, _day: x.day }));
    if (!recipes.length) return `<div class="empty"><div class="e">👩‍🍳</div><p>Nog geen recepten deze week.</p></div>`;
    return `<h2 style="margin-top:4px">Wat gaan we koken?</h2><div class="pick">${recipes.map((r) => `
      <button data-a="cook" data-v="${esc(r.id)}"><span class="e">${esc(r.emoji || "🍽️")}</span>
        <span style="flex:1">${r._day ? `<span class="muted small">${esc(cap(DAYS[r._day] || r._day))}</span><br>` : ""}<b>${esc(r.title)}</b><br><span class="muted small">${r.minutes ? `${r.minutes} min · ` : ""}${(r.steps || []).length} stappen${r.rating ? (r.rating > 0 ? " · 👍" : " · 👎") : ""}</span></span>
        <span style="color:var(--acc);font-weight:700">›</span></button>`).join("")}</div>`;
  }

  _recipe() { return (this.plan?.recipes || []).find((r) => r.id === this.ui.cook); }

  _stepTimer(s) {
    if (s.timer_sec) return Number(s.timer_sec);
    const m = String(s.text || "").match(/(\d+)\s*(?:-|–|tot)?\s*(\d+)?\s*(min|minuten|minuut)\b/i);
    return m ? Number(m[2] || m[1]) * 60 : null;
  }

  _cookView() {
    const r = this._recipe();
    if (!r) return "";
    const steps = r.steps || [];
    const n = steps.length;
    const i = this.ui.step; // -1 = klaarzetten, n = klaar
    const ings = r.ingredients || [];
    const pantry = r.pantry || [];
    const ingList = (all) => `<ul class="ing">${all.map((x, k) => {
      const t = typeof x === "string" ? x : x.text || x.name;
      const on = this.ui.checked[k];
      return `<li class="${on ? "done" : ""}" data-a="check" data-v="${k}"><span class="box">${on ? "✓" : ""}</span>${esc(t)}</li>`;
    }).join("")}</ul>`;
    let content, side = "";
    if (i < 0) {
      content = `<div class="num">Klaarzetten</div>
        <div style="font-size:20px;font-weight:600">${r.servings ? esc(r.servings) : "2 volw. + Kai"}${r.minutes ? ` · ${r.minutes} min` : ""}</div>
        ${ingList(ings)}
        ${pantry.length ? `<div class="muted">Uit de kast: ${esc(pantry.join(", "))}</div>` : ""}`;
    } else if (i >= n) {
      content = `<div class="num">Klaar</div><div class="txt">Eet smakelijk! 🍽️</div>
        <div class="muted" style="text-align:center">Hoe was het?</div>
        <div class="rate"><button class="${r.rating > 0 ? "on" : ""}" data-a="rate" data-v="1">👍</button><button class="${r.rating < 0 ? "on" : ""}" data-a="rate" data-v="-1">👎</button></div>`;
    } else {
      const s = steps[i];
      const tsec = this._stepTimer(s);
      const tips = [];
      if (i === 0 && r.tips?.kai) tips.push(`👦 ${esc(r.tips.kai)}`);
      if (i === n - 1 && r.tips?.michelle) tips.push(`🤰 ${esc(r.tips.michelle)}`);
      if (s.tip) tips.push(`💡 ${esc(s.tip)}`);
      content = `<div class="num">Stap ${i + 1} van ${n}</div>
        <div class="txt">${esc(s.text)}</div>
        ${tips.map((t) => `<div class="tip">${t}</div>`).join("")}
        ${tsec ? `<div><button class="btn ghost" data-a="timer" data-v="${tsec}" data-l="${esc(r.title.split(" ").slice(0, 2).join(" "))} · stap ${i + 1}">⏱ Timer ${Math.round(tsec / 60)} min</button></div>` : ""}`;
      side = `<div class="num" style="margin-bottom:10px">Ingrediënten</div>${ingList(ings)}`;
    }
    const timers = this.timers.map((t, k) => {
      const left = Math.max(0, Math.round((t.end - Date.now()) / 1000));
      const done = left === 0;
      return `<button class="tchip ${done ? "done" : ""}" data-a="tstop" data-v="${k}">⏱ ${esc(t.label)} ${done ? "klaar!" : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}</button>`;
    }).join("");
    return `<div class="cook">
      <div class="top"><span style="font-size:26px">${esc(r.emoji || "🍽️")}</span><span class="t">${esc(r.title)}</span><button class="x" data-a="close" aria-label="sluiten">✕</button></div>
      <div class="stage ${side ? "split" : ""}">
        ${side ? `<div class="side">${side}</div>` : ""}
        <div class="main">${content}${timers ? `<div class="timers">${timers}</div>` : ""}</div>
        ${i >= 0 && i < n ? `<button class="tap l" data-a="prev" aria-label="vorige"></button><button class="tap r" data-a="next" aria-label="volgende"></button>` : ""}
      </div>
      <div class="bottom">
        <button class="nav" data-a="prev" ${i < 0 ? "disabled style='opacity:.3'" : ""}>‹</button>
        <div class="dots">${[-1, ...steps.map((_, k) => k)].map((k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
        ${i >= n ? `<button class="nav p" data-a="close">✓</button>` : `<button class="nav p" data-a="next">›</button>`}
      </div></div>`;
  }

  async _wakeLock() {
    try { if ("wakeLock" in navigator && !this._wake) this._wake = await navigator.wakeLock.request("screen"); } catch (_) {}
  }
  _releaseWake() { try { this._wake?.release(); } catch (_) {} this._wake = null; }

  _beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.35, 0.7].forEach((t) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.3);
      });
      navigator.vibrate?.([200, 100, 200]);
    } catch (_) {}
  }

  _ensureTick() {
    if (this._tick) return;
    this._tick = setInterval(() => {
      if (!this.timers.length) { clearInterval(this._tick); this._tick = null; return; }
      for (const t of this.timers) if (!t.rang && t.end <= Date.now()) { t.rang = true; this._beep(); }
      const chips = this.shadowRoot.querySelectorAll(".tchip");
      if (chips.length !== this.timers.length || this.timers.some((t) => t.end <= Date.now())) return this._render();
      chips.forEach((el, k) => {
        const left = Math.max(0, Math.round((this.timers[k].end - Date.now()) / 1000));
        el.textContent = `⏱ ${this.timers[k].label} ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      });
    }, 1000);
  }

  // ---------- events ----------
  _bind() {
    const root = this.shadowRoot;
    root.querySelectorAll("[data-a]").forEach((el) => el.addEventListener("click", (e) => {
      e.stopPropagation();
      this._act(el.dataset.a, el.dataset.v, el);
    }));
    ["addweek", "addstd"].forEach((id) => {
      const inp = root.getElementById(id);
      inp?.addEventListener("keydown", (e) => { if (e.key === "Enter") this._act(id); });
      inp?.addEventListener("input", () => this._onSearchInput(id, inp.value));
    });
    root.querySelectorAll('input[id^="own-"]').forEach((inp) => inp.addEventListener("input", () => this._onSearchInput(inp.id, inp.value)));
    root.querySelectorAll('input[id^="own-"]').forEach((inp) =>
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") this._act("own", null, { dataset: { q: inp.id.slice(4) } }); }));
    root.querySelectorAll(".strip").forEach((st) => st.addEventListener("scroll", () => this._stripDots(st), { passive: true }));
    // swipe left to remove
    root.querySelectorAll(".item[data-key], .item[data-std]").forEach((el) => this._swipe(el));
    // swipe through cooking steps
    const stage = root.querySelector(".cook .stage");
    if (stage) {
      let x0 = null, y0 = null;
      stage.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
      stage.addEventListener("touchend", (e) => {
        if (x0 == null) return;
        const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
        x0 = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) this._act(dx < 0 ? "next" : "prev");
      });
    }
  }

  _swipe(el) {
    let x0 = null, y0 = null, dx = 0, locked = null;
    el.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; locked = null; }, { passive: true });
    el.addEventListener("touchmove", (e) => {
      if (x0 == null) return;
      const mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
      if (locked == null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) locked = Math.abs(mx) > Math.abs(my) ? "x" : "y";
      if (locked !== "x") return;
      dx = Math.min(0, mx);
      el.classList.add("dragging"); el.parentElement.classList.add("drag");
      el.style.transform = `translateX(${dx}px)`;
    }, { passive: true });
    el.addEventListener("touchend", () => {
      el.classList.remove("dragging");
      if (!(locked === "x" && dx < -90)) setTimeout(() => el.parentElement?.classList.remove("drag"), 200);
      if (locked === "x" && dx < -90) {
        el.style.transform = "translateX(-110%)";
        setTimeout(() => el.dataset.key ? this._act("remove", el.dataset.key) : this._act("sremove", el.dataset.std), 160);
      } else el.style.transform = "";
      x0 = null;
    });
  }

  _stripDots(st) {
    const cards = st.querySelectorAll(".ocard");
    if (!cards.length) return;
    const w = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : st.clientWidth;
    const idx = Math.max(0, Math.min(cards.length - 1, Math.round(st.scrollLeft / Math.max(1, w))));
    const dots = this.shadowRoot.querySelectorAll(`.sdots[data-day="${st.dataset.day}"] i`);
    dots.forEach((dot, k) => { dot.classList.toggle("on", k === idx); dot.classList.toggle("ch", k !== idx && cards[k].classList.contains("on")); });
  }

  _find(key) { return this._items().find((i) => i.key === key); }
  _findStd(key) { return (this.data?.standard_items || []).find((i) => i.key === key); }

  async _act(a, v, el) {
    const ui = this.ui;
    switch (a) {
      case "tab": ui.tab = v; ui.sure = false; break;
      case "seg": ui.seg = v; break;
      case "plus": case "minus": {
        const it = this._find(v); if (!it) return;
        const q = it.qty + (a === "plus" ? 1 : -1);
        if (q <= 0) return this._act("remove", v);
        it.qty = q; this._render();
        return this._ws({ type: "weekmenu/item_qty", key: v, qty: q });
      }
      case "remove": {
        const it = this._find(v); if (!it) return;
        it.removed = true;
        this._toast(it.source === "advice" ? `Oké, nog genoeg ${it.name.toLowerCase()}. Ik vraag het later weer.` : `${it.name} weggehaald`, { type: "weekmenu/item_removed", key: v, removed: false });
        return this._ws({ type: "weekmenu/item_removed", key: v, removed: true });
      }
      case "restore": return this._ws({ type: "weekmenu/item_removed", key: v, removed: false });
      case "undo": {
        const u = this._toastData?.undo; this._toastData = null;
        if (u) await this._ws(u);
        break;
      }
      case "pick": {
        const f = el?.dataset.f;
        const it = this.sugg?.items?.[Number(el?.dataset.i)];
        if (!f || !it) return;
        const inp = this.shadowRoot.getElementById(f);
        if (inp) inp.value = "";
        this.sugg = null;
        const item = { name: it.name, picnic_id: it.picnic_id || null, image_id: it.image_id || null, unit: it.unit || null, unit_price: it.unit_price ?? null };
        if (f.startsWith("own-")) {
          await this._ws({ type: "weekmenu/answer_item", question_id: f.slice(4), item });
          this._toast(`${it.name} gekozen`);
        } else {
          await this._ws({ type: "weekmenu/add_item", item, qty: 1, target: f === "addstd" ? "standard" : "week" });
          this._toast(`${it.name} toegevoegd`);
        }
        return;
      }
      case "addweek": case "addstd": {
        const inp = this.shadowRoot.getElementById(a);
        const text = inp?.value.trim(); if (!text) return;
        inp.value = ""; this.sugg = null;
        await this._ws({ type: a === "addweek" ? "weekmenu/add_text" : "weekmenu/standard_add", text });
        this._toast("Toegevoegd");
        return;
      }
      case "splus": case "sminus": {
        const it = this._findStd(v); if (!it) return;
        return this._ws({ type: "weekmenu/standard_qty", key: v, qty: it.qty + (a === "splus" ? 1 : -1) });
      }
      case "sremove": {
        const it = this._findStd(v); if (!it) return;
        const qty = it.qty;
        await this._ws({ type: "weekmenu/standard_qty", key: v, qty: 0 });
        this._toast(`${it.name} van vaste lijst gehaald`, { type: "weekmenu/standard_add", text: `${qty}x ${it.name}` });
        return;
      }
      case "approve": {
        if (!ui.sure) {
          ui.sure = true; clearTimeout(this._sureT);
          this._sureT = setTimeout(() => { ui.sure = false; this._render(); }, 4000);
          break;
        }
        ui.sure = false; ui.busy = true; this._render();
        try {
          const r = await this._ws({ type: "weekmenu/approve" });
          const open = (r.days_open || []).length;
          this._toast((r.failed ? `${r.added} in je mandje, ${r.failed} niet gelukt` : `Zondag geregeld. ${r.added} producten in je mandje.`) + (open ? ` ${open} ${open === 1 ? "dag" : "dagen"} zonder keuze = niets koken.` : ""));
          ui.tab = "week";
        } finally { ui.busy = false; }
        break;
      }
      case "reopen": return this._ws({ type: "weekmenu/reopen" });
      case "mchoose": {
        const m = this.plan?.michelle;
        return this._ws({ type: "weekmenu/michelle_choose", option_id: m?.choice === v ? null : v });
      }
      case "answer": {
        const qid = el?.dataset.q;
        const q = (this.plan?.questions || []).find((x) => x.id === qid);
        const opt = v && q?.choice !== v ? v : null;
        return this._ws({ type: "weekmenu/answer", question_id: qid, option_id: opt });
      }
      case "own": {
        const qid = el?.dataset.q;
        const inp = this.shadowRoot.getElementById(`own-${qid}`);
        const text = inp?.value.trim(); if (!text) return;
        inp.value = ""; this.sugg = null;
        await this._ws({ type: "weekmenu/answer_text", question_id: qid, text });
        this._toast("Genoteerd, die bied ik volgende keer ook aan");
        return;
      }
      case "day": ui.openDay = ui.openDay === v ? null : v; ui.prep = null; ui.jump = true; break;
      case "prep": ui.prep = v && ui.prep !== v ? v : null; break;
      case "choose": {
        const dk = el?.dataset.d;
        const d = (this.days || []).find((x) => x.day === dk); if (!d) return;
        const choice = d.choice === v ? null : v;
        ui.prep = null;
        const prev = (this.days || []).find((x) => x !== d && choice && choice !== "none" && x.choice === choice);
        d.choice = choice; if (prev) prev.choice = null;
        this._render();
        await this._ws({ type: "weekmenu/choose_day", day: dk, choice });
        if (prev) this._toast(`Verplaatst van ${DAYS[prev.day] || prev.day} naar ${DAYS[dk] || dk}`);
        return;
      }
      case "cook": ui.cook = v; ui.step = -1; ui.checked = {}; this._wakeLock(); break;
      case "close": ui.cook = null; this._releaseWake(); break;
      case "next": { const n = (this._recipe()?.steps || []).length; ui.step = Math.min(n, ui.step + 1); ui.checked = ui.step < 0 ? ui.checked : ui.checked; break; }
      case "prev": ui.step = Math.max(-1, ui.step - 1); break;
      case "check": ui.checked[v] = !ui.checked[v]; break;
      case "timer": {
        this.timers.push({ end: Date.now() + Number(v) * 1000, label: el?.dataset.l || "Timer" });
        this._ensureTick();
        break;
      }
      case "tstop": this.timers.splice(Number(v), 1); break;
      case "rate": {
        const r = this._recipe(); if (!r) return;
        await this._ws({ type: "weekmenu/feedback", recipe_id: r.id, rating: Number(v) });
        this._toast("Dank! Daar houd ik rekening mee.");
        return;
      }
      default: return;
    }
    this._render();
  }
}

customElements.define("weekmenu-panel", WeekmenuPanel);
