// WCAG AA check of every colour pair the panel uses (text >= 4.5:1, borders/icons >= 3:1).
import { test } from "node:test";
import assert from "node:assert/strict";
import { COLORS } from "../src/tokens.js";

const lum = (hex) => {
  const c = hex.replace("#", "").match(/../g).map((x) => parseInt(x, 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};
export const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const TEXT = [
  ["text", "surface"], ["text", "bg"], ["text", "surface2"],
  ["text2", "surface"], ["text2", "bg"], ["text2", "surface2"],
  ["accent", "surface"], ["accent", "accentSoft"], ["onAccent", "accent"],
  ["attention", "surface"], ["attention", "attentionSoft"],
  ["danger", "surface"], ["danger", "dangerSoft"], ["onDanger", "danger"],
  ["deal", "dealSoft"], ["onToast", "toast"], ["toastAction", "toast"],
  ["surface", "attention"], // tab badge, finished timer
];
const UI = [["border", "surface"], ["border", "bg"], ["border", "surface2"], ["accent", "surface2"], ["accent", "bg"]];

for (const mode of ["light", "dark"]) {
  const c = COLORS[mode];
  for (const [fg, bg] of TEXT) {
    test(`${mode}: ${fg} on ${bg} >= 4.5`, () => assert.ok(ratio(c[fg], c[bg]) >= 4.5, `${ratio(c[fg], c[bg]).toFixed(2)}`));
  }
  for (const [fg, bg] of UI) {
    test(`${mode}: ${fg} on ${bg} >= 3`, () => assert.ok(ratio(c[fg], c[bg]) >= 3, `${ratio(c[fg], c[bg]).toFixed(2)}`));
  }
}
