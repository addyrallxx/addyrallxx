// Builds every graphic on Adnan's GitHub profile, in a day and a night
// variant, from the portfolio's Level 4 "Two skies" tokens. GitHub shows the
// day file on its light theme and the night file on its dark theme via
// <picture>. Fonts are embedded as Google Fonts subsets (text= parameter) so
// the type renders exactly inside an <img>.
// Run: node build.mjs   (needs network for the font subsets)
import { writeFile, mkdir } from "node:fs/promises";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const OUT = new URL("./assets/", import.meta.url);

export const T = {
  day: { bg: "#F3F0E8", ink: "#0A0F2C", ink2: "#5C6178", ink3: "#9A9DAA", line: "rgba(10,15,44,.14)", accent: "#2340FF" },
  night: { bg: "#030817", bg2: "#08143A", ink: "#EEF1FA", ink2: "#9AA3C0", ink3: "#5D6684", line: "rgba(238,241,250,.14)", accent: "#8EA2FF" },
};

const ASCII = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");

async function font(family, axes, text) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}:${axes}&text=${encodeURIComponent(text)}`, { headers: { "User-Agent": UA } })).text();
  const url = css.match(/url\((https:[^)]+)\)/)[1];
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  return buf.toString("base64");
}

let FONTS;
export async function fonts() {
  if (FONTS) return FONTS;
  const [display, body4, body5] = await Promise.all([
    font("Archivo", "wdth,wght@125,800", "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'&.,/ "),
    font("Instrument+Sans", "wght@400", ASCII),
    font("Instrument+Sans", "wght@500", ASCII),
  ]);
  FONTS = `<style>
@font-face{font-family:D;src:url(data:font/woff2;base64,${display}) format('woff2');font-weight:800}
@font-face{font-family:B;src:url(data:font/woff2;base64,${body4}) format('woff2');font-weight:400}
@font-face{font-family:B;src:url(data:font/woff2;base64,${body5}) format('woff2');font-weight:500}
.d{font-family:D;font-weight:800;text-transform:uppercase}
.b{font-family:B;font-weight:400}.m{font-family:B;font-weight:500}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
</style>`;
  return FONTS;
}

// Deterministic randomness so the sky is the same on every build.
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The night sky: stars denser along a diagonal Milky Way band, a few
// twinkle gently (Adnan found the site's twinkle too busy, so here only one
// star in ten moves and only to 60 percent), five glints, one shooting star.
export function sky(w, h, seed = 7) {
  const r = rng(seed);
  const stars = [];
  const n = Math.round((w * h) / 1900);
  for (let i = 0; i < n; i++) {
    let x = r() * w, y = r() * h;
    // pull a share of stars toward the band y = 0.9h - 0.55x
    if (r() < 0.45) { const by = h * 0.95 - x * 0.55 * (h / w) * 2.2; y = by + (r() + r() + r() - 1.5) * h * 0.22; }
    if (y < 0 || y > h) continue;
    const s = Math.pow(r(), 3.2);
    const rad = (0.35 + s * 1.25).toFixed(2);
    const warm = r() < 0.5;
    const c = warm ? "#FFE3C2" : "#CFDBFF";
    const o = (0.35 + s * 0.65).toFixed(2);
    const tw = r() < 0.1 ? ` class="tw" style="animation-delay:-${(r() * 6).toFixed(1)}s;animation-duration:${(4 + r() * 4).toFixed(1)}s"` : "";
    stars.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad}" fill="${c}" opacity="${o}"${tw}/>`);
  }
  const glints = [];
  for (let i = 0; i < 5; i++) {
    const x = (0.1 + r() * 0.85) * w, y = (0.08 + r() * 0.5) * h, L = 7 + r() * 6;
    glints.push(`<g opacity=".9" class="gl" style="animation-delay:-${(r() * 5).toFixed(1)}s"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.6" fill="#fff"/><path d="M${(x - L).toFixed(1)} ${y.toFixed(1)}H${(x + L).toFixed(1)}M${x.toFixed(1)} ${(y - L).toFixed(1)}V${(y + L).toFixed(1)}" stroke="#fff" stroke-width=".5" opacity=".45"/></g>`);
  }
  return `<defs>
<linearGradient id="ng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${T.night.bg}"/><stop offset="1" stop-color="${T.night.bg2}"/></linearGradient>
<linearGradient id="mw" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#F2D6B3" stop-opacity="0"/><stop offset=".45" stop-color="#9DB4FF" stop-opacity=".16"/><stop offset=".6" stop-color="#F2D6B3" stop-opacity=".12"/><stop offset="1" stop-color="#9DB4FF" stop-opacity="0"/></linearGradient>
<linearGradient id="au" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2BD49A"/><stop offset=".5" stop-color="#4FB6C8"/><stop offset="1" stop-color="#7A5CFF"/></linearGradient>
<filter id="bl" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="${(h * 0.06).toFixed(0)}"/></filter>
<filter id="bl2" x="-20%" y="-80%" width="140%" height="260%"><feGaussianBlur stdDeviation="${(h * 0.035).toFixed(0)}"/></filter>
<linearGradient id="ss" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#FFF4E0"/></linearGradient>
</defs>
<style>
.tw{animation:tw 6s ease-in-out infinite alternate}@keyframes tw{to{opacity:.25}}
.gl{animation:gl 5s ease-in-out infinite alternate}@keyframes gl{to{opacity:.55}}
.au{animation:au 16s ease-in-out infinite alternate}@keyframes au{to{transform:translateX(${(w * 0.06).toFixed(0)}px)}}
.sh{animation:sh 9s linear infinite;opacity:0}@keyframes sh{0%{transform:translate(0,0);opacity:0}2%{opacity:1}9%{transform:translate(${(w * 0.28).toFixed(0)}px,${(h * 0.32).toFixed(0)}px);opacity:0}100%{opacity:0}}
</style>
<rect width="${w}" height="${h}" fill="url(#ng)"/>
<path d="M0 ${h * 0.98} L${w} ${-h * 0.25} L${w} ${h * 0.25} L0 ${h * 1.5}Z" fill="url(#mw)" filter="url(#bl)"/>
<g class="au" opacity=".16"><ellipse cx="${w * 0.42}" cy="${h * 1.02}" rx="${w * 0.55}" ry="${h * 0.12}" fill="url(#au)" filter="url(#bl2)"/></g>
${stars.join("")}${glints.join("")}
<g class="sh"><path d="M${w * 0.18} ${h * 0.12} l${w * 0.07} ${h * 0.08}" stroke="url(#ss)" stroke-width="1.4" stroke-linecap="round"/></g>`;
}

export function paper(w, h) {
  return `<defs><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0.04  0 0 0 0 0.06  0 0 0 0 0.17  0 0 0 .07 0"/></filter>
<radialGradient id="vg" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#F3F0E8" stop-opacity="0"/><stop offset="1" stop-color="#E4DCCB" stop-opacity=".7"/></radialGradient></defs>
<rect width="${w}" height="${h}" fill="${T.day.bg}"/><rect width="${w}" height="${h}" filter="url(#gr)"/><rect width="${w}" height="${h}" fill="url(#vg)"/>`;
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Header: the site's hero in miniature. A horizon draws in, the sun (day)
// or crescent (night) sits on it, SYSTEMS WITH TASTE below.
async function header(mode) {
  const w = 1280, h = 460, t = T[mode];
  const ground = mode === "day" ? paper(w, h) : sky(w, h, 11);
  const orb = mode === "day"
    ? `<circle cx="1150" cy="150" r="30" fill="none" stroke="${t.ink}" stroke-width="1.5" clip-path="url(#up)"/><circle cx="1150" cy="150" r="30" fill="${t.accent}" clip-path="url(#up)" class="rise"/>`
    : `<mask id="cr"><rect width="${w}" height="${h}" fill="#fff"/><circle cx="1162" cy="140" r="27" fill="#000"/></mask><circle cx="1150" cy="150" r="30" fill="${t.ink}" mask="url(#cr)" clip-path="url(#up)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Adnan Shakib. Systems with taste.">
${await fonts()}
<style>.hz{stroke-dasharray:1184;stroke-dashoffset:1184;animation:hz 2.2s cubic-bezier(.76,0,.24,1) .2s forwards}@keyframes hz{to{stroke-dashoffset:0}}
.rise{animation:rise 2.4s cubic-bezier(.16,1,.3,1) .6s both}@keyframes rise{from{transform:translateY(34px)}}
.up{animation:up 1.1s cubic-bezier(.16,1,.3,1) both}@keyframes up{from{transform:translateY(40px);opacity:0}}</style>
<clipPath id="r"><rect width="${w}" height="${h}" rx="18"/></clipPath><clipPath id="up"><rect x="0" y="0" width="${w}" height="150"/></clipPath>
<g clip-path="url(#r)">${ground}
<text x="48" y="64" class="m" font-size="16" fill="${t.ink}" letter-spacing=".2">Adnan Shakib</text>
<text x="${w - 48}" y="64" class="m" font-size="16" fill="${t.ink2}" text-anchor="end">CS, University of Calgary 2028  ·  Co-founder, Puzzled  ·  Incoming MD, TotalTex</text>
<path d="M48 150H${w - 48}" stroke="${t.ink}" stroke-width="1" opacity=".55" class="hz"/>
${orb}
<text x="44" y="300" class="d up" font-size="124" fill="${t.ink}" style="font-stretch:125%;animation-delay:.7s">SYSTEMS</text>
<text x="44" y="412" class="d up" font-size="124" fill="${t.ink}" style="font-stretch:125%;animation-delay:.8s">WITH TASTE</text>
<text x="${w - 48}" y="190" class="b" font-size="17" fill="${t.ink2}" text-anchor="end">I build the software that runs a car dealership</text>
<text x="${w - 48}" y="213" class="b" font-size="17" fill="${t.ink2}" text-anchor="end">operation in Calgary and a garment factory in Dhaka.</text>
</g></svg>`;
}

// Section title strip, e.g. "SELECTED WORK" with an index count.
async function title(mode, text, note) {
  const w = 1280, h = 120, t = T[mode];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(text)}">
${await fonts()}
<text x="4" y="84" class="d" font-size="64" fill="${t.ink}" style="font-stretch:125%">${esc(text)}</text>
<text x="${w - 4}" y="84" class="m" font-size="16" fill="${t.ink2}" text-anchor="end">${esc(note)}</text>
<path d="M4 108H${w - 4}" stroke="${t.ink}" opacity=".18"/></svg>`;
}

export async function save(name, mode, svg) {
  await mkdir(OUT, { recursive: true });
  await writeFile(new URL(`${name}-${mode}.svg`, OUT), svg);
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  for (const mode of ["day", "night"]) {
    await save("header", mode, await header(mode));
    await save("title-work", mode, await title(mode, "Selected work", "Six things I built and run"));
    await save("title-studio", mode, await title(mode, "How I build", "One person, three models, one standard"));
  }
  console.log("built");
}
