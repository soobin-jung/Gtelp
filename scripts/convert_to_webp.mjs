import sharp from "sharp";
import { readdir, mkdir, writeFile } from "fs/promises";
import { join, basename } from "path";

const SRC_DIR = "data/reading/word_img";
const OUT_DIR = "public/word-images";
const MAX_WIDTH = 800;
const QUALITY = 82;

function normalizeWordKey(word) {
  return String(word ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(SRC_DIR)).filter((f) =>
  /\.(png|jpg|jpeg)$/i.test(f)
);

console.log(`Converting ${files.length} images...`);

let ok = 0, fail = 0;

for (const file of files) {
  const base = basename(file).replace(/\.(png|jpg|jpeg)$/i, "");
  const key = normalizeWordKey(base);
  const outFile = join(OUT_DIR, `img_${key}.webp`);

  try {
    await sharp(join(SRC_DIR, file))
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(outFile);
    ok++;
    process.stdout.write(`\r${ok}/${files.length}`);
  } catch (e) {
    console.error(`\nFailed: ${file} — ${e.message}`);
    fail++;
  }
}

const manifest = (await readdir(OUT_DIR))
  .filter((f) => /\.webp$/i.test(f))
  .map((f) => f.replace(/^img_/, "").replace(/\.webp$/i, ""));

await writeFile(
  "src/data/wordImageKeys.json",
  JSON.stringify(manifest, null, 2)
);

console.log(`\nDone: ${ok} converted, ${fail} failed → ${OUT_DIR}`);
console.log(`Manifest: ${manifest.length} keys → src/data/wordImageKeys.json`);
