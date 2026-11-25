// Design tokens: one place for colour, type, space, radius and elevation.
// Colours are checked by test/contrast.test.js (WCAG AA: text >= 4.5:1, borders and icons >= 3:1)
// against Home Assistant's default light and dark surfaces.

// Colour roles (each colour means one thing):
//   accent    -> action and "chosen" (primary button, selected option, progress)
//   deal      -> money: promotions and savings labels
//   attention -> needs you: open day, product not linked to Picnic
//   danger    -> remove, failed
//   neutrals  -> everything else (status "voorstel klaar", tips, meta)
export const COLORS = {
  light: {
    bg: "#fafafa", // HA primary-background-color (fallback)
    surface: "#ffffff", // HA card-background-color (fallback)
    surface2: "#f3f3f3", // sunken: chips, option cards, inputs
    text: "#212121",
    text2: "#626262",
    line: "#e6e6e6", // decorative dividers only
    border: "#878787", // inputs, checkboxes, inactive progress (>= 3:1)
    accent: "#1f7a45",
    onAccent: "#ffffff",
    accentSoft: "#e9f2ec",
    attention: "#9a4f0c",
    attentionSoft: "#f6ede6",
    danger: "#c62f37",
    onDanger: "#ffffff",
    dangerSoft: "#faeaeb",
    deal: "#6b4a00",
    dealSoft: "#fff1c2",
    scrim: "rgba(0,0,0,.45)",
    toast: "#2a2a2a",
    onToast: "#ffffff",
    toastAction: "#8fe0b0",
  },
  dark: {
    bg: "#111111",
    surface: "#1c1c1c",
    surface2: "#262626",
    text: "#e1e1e1",
    text2: "#a3a3a3",
    line: "#2e2e2e",
    border: "#7c7c7c",
    accent: "#5fcf8d",
    onAccent: "#0b1f14",
    accentSoft: "#1f3328",
    attention: "#f0a25a",
    attentionSoft: "#35291e",
    danger: "#ff7a7a",
    onDanger: "#2a0b0b",
    dangerSoft: "#3a2223",
    deal: "#ffd666",
    dealSoft: "#3a3320",
    scrim: "rgba(0,0,0,.6)",
    toast: "#e8e8e8",
    onToast: "#121212",
    toastAction: "#19683a",
  },
};

// Neutrals follow the user's HA theme when it sets them; the rest are ours.
const FROM_HA = {
  bg: "--primary-background-color",
  surface: "--card-background-color",
  text: "--primary-text-color",
};

const kebab = (k) => k.replace(/[A-Z0-9]/g, (c) => "-" + c.toLowerCase());

export function colorVars(mode) {
  return Object.entries(COLORS[mode])
    .map(([k, v]) => `--wm-${kebab(k)}: ${FROM_HA[k] ? `var(${FROM_HA[k]}, ${v})` : v};`)
    .join("\n  ");
}

export const SCALE = `
  --wm-font: var(--ha-font-family-body, var(--mdc-typography-font-family, Roboto, system-ui, -apple-system, "Segoe UI", sans-serif));
  --wm-fs-xs: 12px; --wm-fs-sm: 14px; --wm-fs-md: 16px; --wm-fs-lg: 20px; --wm-fs-xl: 28px; --wm-fs-cook: clamp(24px, 4.4vw, 38px);
  --wm-fw-regular: 400; --wm-fw-medium: 500; --wm-fw-bold: 700;
  --wm-s1: 4px; --wm-s2: 8px; --wm-s3: 12px; --wm-s4: 16px; --wm-s5: 24px; --wm-s6: 32px;
  --wm-r-sm: 8px; --wm-r-md: 12px; --wm-r-lg: 20px; --wm-r-full: 999px;
  --wm-ease: cubic-bezier(.2, .8, .2, 1);
`;

export const ELEVATION = {
  light: `--wm-shadow-1: 0 1px 2px rgba(0,0,0,.06), 0 2px 8px rgba(0,0,0,.04); --wm-shadow-2: 0 8px 28px rgba(0,0,0,.18); --wm-edge: transparent;`,
  // shadows don't show on near-black: a hairline edge separates surfaces instead
  dark: `--wm-shadow-1: none; --wm-shadow-2: 0 8px 28px rgba(0,0,0,.6); --wm-edge: rgba(255,255,255,.07);`,
};
