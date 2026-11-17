// Turns the originals in assets-src/ into web-ready files in public/images/.
// Run with `npm run images` after scripts/import-wp.py or after adding photos. Skips up-to-date files.
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, extname, join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const src = (p) => join(root, "assets-src", p);
const out = (p) => join(root, "public/images", p);
const INDIGO = { r: 29, g: 0, b: 92, alpha: 1 }; // #1d005c, the 2026 logo colour

function fresh(from, to) {
  return existsSync(to) && statSync(to).mtimeMs >= statSync(from).mtimeMs;
}

async function webp(from, to, width, quality = 78) {
  const f = src(from);
  const t = out(to);
  if (fresh(f, t)) return;
  mkdirSync(dirname(t), { recursive: true });
  const info = await sharp(f).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(t);
  console.log(`${to} ${info.width}x${info.height}`);
}

// Photography: [source, output name, widths]
const photos = [
  ["img/riyadh-city-sky-c.jpg", "photo/riyadh-skyline", [1200, 640]],
  ["img/riyadh-mumlaka-blue.jpg", "photo/kingdom-night", [1800, 900]],
  ["img/ithra-light.jpg", "photo/ithra", [1600, 800]],
  ["img/mumlaka-night-portrait.jpg", "photo/kingdom-portrait", [800, 480]],
  ["img/vision-content-6.jpg", "photo/towers", [1400, 760]],
  ["img/riyadh-city-sky.jpg", "photo/riyadh-aerial", [1000, 600]],
  ["img/hero-events-4.jpg", "photo/towers-sky", [1140, 640]],
  ["img/leadcrystal-hero.jpg", "photo/leadcrystal-hero", [1300, 700]],
];
for (const [from, name, widths] of photos) {
  for (const w of widths) await webp(from, `${name}-${w}.webp`, w);
}

for (const f of readdirSync(src("services"))) {
  const slug = basename(f, extname(f));
  await webp(`services/${f}`, `services/${slug}-1200.webp`, 1200);
  await webp(`services/${f}`, `services/${slug}-640.webp`, 640);
}
for (const f of readdirSync(src("posts"))) {
  const slug = basename(f, extname(f));
  await webp(`posts/${f}`, `posts/${slug}-1200.webp`, 1200);
  await webp(`posts/${f}`, `posts/${slug}-640.webp`, 640);
}

// Partner logos (white backgrounds; the CSS multiplies them onto the page colour)
const partners = {
  "partners/2.jpg": "servotel",
  "partners/neil-patel-digital.jpg": "np-digital",
  "partners/4.jpg": "soho-hospitality",
  "partners/5.jpg": "keos",
  "partners/ecore.jpg": "ecore",
  "partners/leadcrystal-betta.png": "lead-crystal",
  "partners/vibe-squad.jpg": "vibe-squad",
};
for (const [from, name] of Object.entries(partners)) {
  const t = out(`partners/${name}.webp`);
  if (fresh(src(from), t)) continue;
  mkdirSync(dirname(t), { recursive: true });
  await sharp(src(from)).flatten({ background: "#ffffff" }).trim({ threshold: 12 })
    .resize({ height: 160, width: 420, fit: "inside" }).webp({ quality: 88 }).toFile(t);
  console.log(`partners/${name}.webp`);
}

// Brand: the 2026 wordmarks at 2x header size, and square icons cut from the sail mark
mkdirSync(out("brand"), { recursive: true });
for (const c of ["white", "blue"]) {
  await sharp(src(`brand/logo-${c}.png`)).trim().resize({ height: 168 }).png({ compressionLevel: 9 })
    .toFile(out(`brand/logo-${c}.png`));
}
const mark = await sharp(src("brand/logo-white.png")).extract({ left: 8, top: 139, width: 243, height: 670 }).toBuffer();
for (const s of [512, 192, 180, 32]) {
  const inner = await sharp(mark).resize({ height: Math.round(s * 0.74) }).toBuffer();
  await sharp({ create: { width: s, height: s, channels: 4, background: INDIGO } })
    .composite([{ input: inner, gravity: "center" }]).png().toFile(out(`brand/icon-${s}.png`));
}
await sharp(out("brand/icon-32.png")).toFile(join(root, "public/favicon.png"));

// Default social share image (1200x630)
await sharp(src("img/riyadh-city-sky-c.jpg")).resize(1200, 630, { fit: "cover" }).jpeg({ quality: 82 })
  .toFile(out("og-default.jpg"));
console.log("images done");
