/**
 * Reads the design tokens straight out of globals.css and computes the WCAG
 * contrast ratio for every text/surface pairing the interface actually uses.
 *
 * Parsing the real stylesheet rather than a copy of the palette is the point:
 * a duplicated table drifts, and a drifted accessibility check is worse than
 * none because it reports pass while the app fails.
 *
 *   npm run check:contrast
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

// ---------------------------------------------------------------------------
// Colour maths
// ---------------------------------------------------------------------------

function readToken(name: string): string {
  const m = CSS.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  if (!m) throw new Error(`Token --${name} not found (or is not a hex value)`);
  return m[1];
}

function toRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// ---------------------------------------------------------------------------
// What to check
// ---------------------------------------------------------------------------

const SURFACES = ["surface", "surface-raised", "surface-overlay", "surface-sunken"] as const;

/** Roles that carry readable text and therefore need 4.5:1. */
const TEXT_ROLES = [
  "text-primary",
  "text-secondary",
  "text-tertiary",
  "amber",
  "teal",
  "masked",
  "warning",
  "danger",
  "disabled-fg",
] as const;

/** Foreground-on-fill pairings for filled controls. */
const ON_FILL: Array<[string, string]> = [
  ["on-amber", "amber"],
  ["on-teal", "teal"],
  ["on-masked", "masked"],
];

/**
 * Boundaries of interactive controls — input, select, outline button. The
 * border IS how you identify the component, so WCAG 1.4.11 applies: 3:1.
 */
const INTERACTIVE_BOUNDARIES = ["border-strong"] as const;

/**
 * Decorative dividers and card edges. WCAG 1.4.11 does not apply: a card is
 * not an interactive component, and it is identified by its fill as well as
 * its edge. Reported for information, not enforced — lowering the bar would
 * be dishonest, so instead these are stated as out of scope.
 */
const DECORATIVE = ["border-subtle", "border-default"] as const;

const AA_TEXT = 4.5;
const AA_UI = 3.0;

let failures = 0;

function row(label: string, r: number, threshold: number) {
  const pass = r >= threshold;
  if (!pass) failures++;
  const mark = pass ? "PASS" : "FAIL";
  console.log(
    `  ${label.padEnd(42)} ${r.toFixed(2).padStart(6)}:1   ${mark}  (needs ${threshold})`,
  );
}

console.log("\nWCAG AA contrast — IndusMate tokens");
console.log("═".repeat(78));

for (const surface of SURFACES) {
  const bg = readToken(surface);
  console.log(`\nOn --${surface}  ${bg}`);
  for (const role of TEXT_ROLES) {
    row(`${role}`, ratio(readToken(role), bg), AA_TEXT);
  }
  for (const role of INTERACTIVE_BOUNDARIES) {
    row(`${role} (control boundary)`, ratio(readToken(role), bg), AA_UI);
  }
  for (const role of DECORATIVE) {
    const r = ratio(readToken(role), bg);
    console.log(`  ${`${role} (decorative)`.padEnd(42)} ${r.toFixed(2).padStart(6)}:1   n/a   1.4.11 out of scope`);
  }
}

console.log(`\nText on filled controls`);
for (const [fg, bg] of ON_FILL) {
  row(`${fg} on ${bg}`, ratio(readToken(fg), readToken(bg)), AA_TEXT);
}

console.log("\n" + "═".repeat(78));
if (failures === 0) {
  console.log("All pairings pass WCAG AA.\n");
} else {
  console.log(`${failures} pairing(s) BELOW WCAG AA — fix before shipping.\n`);
  process.exit(1);
}
