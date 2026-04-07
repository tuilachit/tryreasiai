import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const repoRoot = process.cwd();

const masterRel = "public/icons/source/master.png";
const masterPath = path.join(repoRoot, masterRel);

async function fileExists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

const targets = [
  { outRel: "public/icon-192.png", size: 192 },
  { outRel: "public/icon-512.png", size: 512 },
  { outRel: "public/apple-touch-icon.png", size: 180 },
  { outRel: "public/favicon-32x32.png", size: 32 },
  { outRel: "public/favicon-16x16.png", size: 16 },
];

if (!(await fileExists(masterPath))) {
  console.error(
    `Error: master icon not found at ${masterRel}\n` +
      `Expected: ${masterPath}`,
  );
  process.exit(1);
}

const img = sharp(masterPath, { failOnError: false });
const meta = await img.metadata();
const w = meta.width ?? 0;
const h = meta.height ?? 0;

if (w > 0 && h > 0) {
  if (w !== h) {
    console.warn(`Warning: master icon is not square (${w}×${h}).`);
  }
  if (w < 512 || h < 512) {
    console.warn(
      `Warning: master icon is smaller than 512×512 (${w}×${h}).`,
    );
  }
} else {
  console.warn("Warning: could not read master icon dimensions.");
}

let generated = 0;
for (const t of targets) {
  const outPath = path.join(repoRoot, t.outRel);
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await sharp(masterPath, { failOnError: false })
    .resize(t.size, t.size, { fit: "cover", position: "center" })
    .png()
    .toFile(outPath);
  console.log(`✓ Generated ${t.outRel} (${t.size}×${t.size})`);
  generated += 1;
}

console.log(`Done. Generated ${generated} icon files.`);

