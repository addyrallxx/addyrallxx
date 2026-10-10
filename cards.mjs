// Project cards for the GitHub profile, day and night. Live projects show a
// real screenshot; private ones show an animated flow diagram instead, so no
// private code or data ever appears. Run after build.mjs: node cards.mjs
import { createRequire } from "node:module";
import { T, fonts, sky, paper, save } from "./build.mjs";

const sharp = createRequire("C:/Users/adnan/projects/portfolio/package.json")("sharp");
const SHOTS = "C:/Users/adnan/projects/github-showcase/shots/";
const W = 1280, H = 520, MX = 600, MY = 40, MW = 632, MH = 440;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

function wrap(text, max) {
  const out = [""];
  for (const w of text.split(" ")) {
    if ((out.at(-1) + " " + w).trim().length > max) out.push(w);
    else out[out.length - 1] = (out.at(-1) + " " + w).trim();
  }
  return out;
}

async function jpg(file, w, h, position = "northwest") {
  const buf = await sharp(SHOTS + file).resize(w, h, { fit: "cover", position }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

// One screenshot filling the media frame.
async function shot(file) {
  return `<image href="${await jpg(file, MW * 2, MH * 2)}" x="${MX}" y="${MY}" width="${MW}" height="${MH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#mf)"/>`;
}

// Three phone screens fanned like the portfolio's card fan.
async function phones(files, t) {
  const pw = 176, ph = 380, cx = MX + MW / 2, cy = MY + MH / 2 + 10;
  const pose = [[-150, 18, -8], [0, 0, 0], [150, 18, 8]];
  let s = "";
  for (const i of [0, 2, 1]) {
    const [dx, dy, r] = pose[i];
    const href = await jpg(files[i], pw * 2, ph * 2);
    s += `<g transform="translate(${cx + dx} ${cy + dy}) rotate(${r})"><clipPath id="ph${i}"><rect x="${-pw / 2}" y="${-ph / 2}" width="${pw}" height="${ph}" rx="22"/></clipPath>
<rect x="${-pw / 2 - 5}" y="${-ph / 2 - 5}" width="${pw + 10}" height="${ph + 10}" rx="26" fill="${t.ink}"/>
<image href="${href}" x="${-pw / 2}" y="${-ph / 2}" width="${pw}" height="${ph}" preserveAspectRatio="xMidYMid slice" clip-path="url(#ph${i})"/></g>`;
  }
  return s;
}

// A left to right flow: nodes on a zigzag, a dash travelling the wire.
function flow(nodes, t, mode) {
  const n = nodes.length, gap = MW / n;
  const fill = mode === "day" ? "#FBF9F4" : "rgba(8,20,58,.85)";
  const pts = nodes.map((_, i) => [MX + gap * (i + 0.5), MY + MH / 2 + (i % 2 ? 70 : -70)]);
  const wire = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(0)} ${p[1]}`).join("");
  const boxes = nodes.map(([title, sub], i) => {
    const [x, y] = pts[i], bw = gap - 14, bh = 108;
    const subs = wrap(sub, Math.floor(bw / 7.2)).slice(0, 3);
    return `<g class="nd" style="animation-delay:${(i * 0.35).toFixed(2)}s"><rect x="${x - bw / 2}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${t.line}"/>
<text x="${x - bw / 2 + 12}" y="${y - bh / 2 + 24}" class="m" font-size="11" fill="${t.ink3}" letter-spacing=".9">0${i + 1}</text>
<text x="${x - bw / 2 + 12}" y="${y - bh / 2 + 44}" class="m" font-size="14.5" fill="${t.ink}">${esc(title)}</text>
${subs.map((l, j) => `<text x="${x - bw / 2 + 12}" y="${y - bh / 2 + 62 + j * 14}" class="b" font-size="12" fill="${t.ink2}">${esc(l)}</text>`).join("")}</g>`;
  }).join("");
  return `<style>.wire{stroke-dasharray:6 10;animation:fl 1.6s linear infinite}@keyframes fl{to{stroke-dashoffset:-32}}
.nd{animation:nd 3.2s ease-in-out infinite alternate}@keyframes nd{to{transform:translateY(-4px)}}</style>
<path d="${wire}" fill="none" stroke="${t.ink}" stroke-opacity=".2" stroke-width="1.5"/>
<path d="${wire}" fill="none" stroke="${t.accent}" stroke-width="1.5" class="wire"/>${boxes}`;
}

async function card(mode, p, i) {
  const t = T[mode];
  const ground = mode === "day" ? paper(W, H) : sky(W, H, 30 + i);
  const media = p.shot ? await shot(p.shot) : p.phones ? await phones(p.phones, t) : flow(p.flow, t, mode);
  const frame = p.phones ? "" : `<rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" rx="14" fill="none" stroke="${t.line}"/>`;
  // Balanced: same line count as a 44 char wrap, but evened out.
  const lines = wrap(p.line, Math.ceil(p.line.length / wrap(p.line, 44).length) + 4);
  const chips = [];
  let cx = 48, cy = 432;
  for (const s of p.stack) {
    const w = s.length * 7.6 + 26;
    if (cx + w > 560) { cx = 48; cy += 38; }
    chips.push(`<rect x="${cx}" y="${cy - 20}" width="${w}" height="28" rx="14" fill="none" stroke="${t.line}"/><text x="${cx + 13}" y="${cy - 1}" class="m" font-size="13" fill="${t.ink2}">${esc(s)}</text>`);
    cx += w + 8;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(p.name)}. ${esc(p.line)}">
${await fonts()}
<clipPath id="r"><rect width="${W}" height="${H}" rx="18"/></clipPath><clipPath id="mf"><rect x="${MX}" y="${MY}" width="${MW}" height="${MH}" rx="14"/></clipPath>
<g clip-path="url(#r)">${ground}
<text x="48" y="74" class="m" font-size="13" fill="${t.ink3}" letter-spacing="1">${String(i + 1).padStart(2, "0")}  /  ${esc(p.kind.toUpperCase())}  /  ${esc(p.year.toUpperCase())}</text>
<text x="44" y="150" class="d" font-size="${p.name.length > 10 ? 46 : 60}" fill="${t.ink}" style="font-stretch:125%">${esc(p.name.toUpperCase())}</text>
${lines.map((l, j) => `<text x="48" y="${206 + j * 30}" class="b" font-size="21" fill="${t.ink2}">${esc(l)}</text>`).join("")}
${p.status ? `<circle cx="54" cy="${206 + lines.length * 30 + 14}" r="4" fill="${p.live ? t.accent : "none"}" stroke="${t.accent}"/><text x="66" y="${206 + lines.length * 30 + 19}" class="m" font-size="14" fill="${t.ink}">${esc(p.status)}</text>` : ""}
${chips.join("")}
${media}${frame}
</g></svg>`;
}

export const PROJECTS = [
  { slug: "puzzled", name: "Puzzled", kind: "Dealership listings pipeline", year: "Since 2023", status: "Private, runs daily for client dealerships",
    line: "Reads dealer inventory three times a day and writes a compliant listing for every car.",
    stack: ["Python", "curl_cffi", "Scheduled jobs"],
    flow: [["Dealer sites", "Live inventory on three dealer platforms"], ["Scraper", "Runs three times a day, diffs every car"], ["Generator", "Facts only, province disclaimer attached"], ["Listings", "Ready to post, leads routed back"]] },
  { slug: "totaltex-ops", name: "TotalTex Ops", kind: "Factory order system", year: "2026", status: "Private, runs the factory floor in Dhaka",
    line: "Takes a garment trims order from first quote to final bill, every document from one record.",
    stack: ["Next.js", "TypeScript", "PostgreSQL", "Drizzle"],
    flow: [["Quote", "Priced from the buyer's spec"], ["Order", "One record from here on"], ["Production", "Recorded output the database protects"], ["Documents", "Challan and bill, generated not typed"]] },
  { slug: "totaltex-web", name: "TotalTex Web", kind: "Factory website", year: "2026", status: "Live at totaltex-bd.com", live: true,
    line: "The public face of a Dhaka trims factory, built on its real production photography.",
    stack: ["Next.js", "React Three Fiber", "GSAP"], shot: "totaltex-web-hero-1600.png", href: "https://totaltex-bd.com" },
  { slug: "fittrack", name: "FitTrack", kind: "Offline fitness app", year: "2026", status: "Live, installable", live: true,
    line: "Workouts, food and weight in one installable app that works with no signal.",
    stack: ["Vanilla JS", "Service Worker", "Chart.js"], phones: ["fittrack-2.png", "fittrack-home.png", "fittrack-3.png"], href: "https://addyrallxx.github.io/fittrack/fittrack.html" },
  { slug: "sadman", name: "Sadman Shakib", kind: "Photographer portfolio", year: "2026", status: "Live", live: true,
    line: "A portfolio for my brother's photography, where the pictures do the talking.",
    stack: ["Next.js", "GSAP", "Lenis"], shot: "sadman-hero-1600.png", href: "https://sadman-shakib.vercel.app" },
  { slug: "studio", name: "The Studio", kind: "AI build system", year: "2026", status: "Open source",
    line: "Claude, Codex and Gemini working as one team, with every result re-checked before it ships.",
    stack: ["Claude Code", "Codex CLI", "Gemini", "PowerShell", "Python"],
    flow: [["Plan", "Claude Opus writes the brief"], ["Build", "Parallel agents, each owning its files"], ["Review", "A different model checks the diff"], ["Verify", "Re-run in real Chrome, then ship"]], href: "https://github.com/addyrallxx/studio" },
];

for (const mode of ["day", "night"])
  for (const [i, p] of PROJECTS.entries()) await save(`card-${p.slug}`, mode, await card(mode, p, i));
console.log("cards built");
