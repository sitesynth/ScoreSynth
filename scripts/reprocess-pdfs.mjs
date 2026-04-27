/**
 * PDF Migration — ScoreSynth (final: clean stored files, stamp moved to download)
 *
 * Current state: all 96 files have old corner stamps embedded in pages.
 * This script removes them by painting white over the stamp area on every page,
 * resulting in clean PDFs for preview. The stamp is now added at download time.
 *
 * Skip check: keyword "ss-clean" means the file is already cleaned.
 *
 * Usage:
 *   node scripts/reprocess-pdfs.mjs
 *   node scripts/reprocess-pdfs.mjs --dry-run
 */

import { createClient }   from "@supabase/supabase-js";
import { PDFDocument, rgb } from "pdf-lib";
import { readFile }       from "fs/promises";
import { resolve }        from "path";
import { fileURLToPath }  from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const envPath   = resolve(__dirname, "../.env.local");
let envText = "";
try { envText = await readFile(envPath, "utf8"); } catch {}

function getEnv(key) {
  const m = envText.match(new RegExp(`^${key}=(.+)$`, "m"));
  return m ? m[1].trim() : process.env[key] ?? "";
}

const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY  = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const DRY_RUN      = process.argv.includes("--dry-run");
const DONE_MARKER  = "ss-clean";

// Old stamp dimensions (must match what was drawn in the previous run)
const OLD_STAMP_H = 13 + 4 + 6;   // STAMP_H + underlay padding ≈ 25pt
const OLD_STAMP_W = 120;           // generous width to cover any logo+text combo
const OLD_MARGIN  = 10;
const WHITE = rgb(1, 1, 1);

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Remove old stamp, mark as clean ──────────────────────────────────────────
async function processBuffer(pdfBuffer, scoreTitle) {
  const src = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  // Skip if already clean
  const kw = src.getKeywords() ?? "";
  if (kw.includes(DONE_MARKER)) return null;

  // Paint over old stamp area on every page
  for (const page of src.getPages()) {
    const { width } = page.getSize();
    page.drawRectangle({
      x:      width - OLD_STAMP_W - OLD_MARGIN,
      y:      OLD_MARGIN - 4,
      width:  OLD_STAMP_W + OLD_MARGIN,
      height: OLD_STAMP_H + 8,
      color:  WHITE,
    });
  }

  // Update metadata
  src.setTitle(scoreTitle);
  src.setAuthor("ScoreSynth");
  src.setCreator("ScoreSynth");
  src.setKeywords(["sheet music", "scoresynth", "scoresynth.com", DONE_MARKER]);

  return await src.save();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function downloadFile(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`Download failed: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

async function uploadFile(bucket, path, buffer) {
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
}

async function processPdfPath(bucket, storagePath, title, label) {
  process.stdout.write(`  ${label} ... `);
  if (DRY_RUN) { console.log("(dry-run)"); return { status: "dry-run" }; }

  try {
    const original  = await downloadFile(bucket, storagePath);
    const processed = await processBuffer(original, title);
    if (!processed) { console.log("already clean, skipped"); return { status: "skipped" }; }
    await uploadFile(bucket, storagePath, processed);
    console.log("done");
    return { status: "ok" };
  } catch (err) {
    console.log(`ERROR: ${err.message}`);
    return { status: "error" };
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
console.log(DRY_RUN ? "🔍  DRY-RUN\n" : "🧹  Cleaning old stamps from stored PDFs...\n");

const { data: scores, error: dbErr } = await supabase.from("scores").select("id, title, pdf_url, parts");
if (dbErr) { console.error(dbErr.message); process.exit(1); }

let total = 0, ok = 0, skipped = 0, errors = 0;

for (const score of scores) {
  console.log(`\n📄 ${score.title}`);
  if (score.pdf_url) {
    total++;
    const r = await processPdfPath("score-files", score.pdf_url, score.title, "main PDF");
    if (r.status === "ok") ok++; else if (r.status === "skipped") skipped++; else errors++;
  }
  if (Array.isArray(score.parts)) {
    for (const part of score.parts) {
      if (!part.pdf_url) continue;
      total++;
      const r = await processPdfPath("score-files", part.pdf_url, `${score.title} — ${part.name}`, `part: ${part.name}`);
      if (r.status === "ok") ok++; else if (r.status === "skipped") skipped++; else errors++;
    }
  }
}

console.log(`
────────────────────────────────
  Total   : ${total}
  Cleaned : ${ok}
  Skipped : ${skipped}
  Errors  : ${errors}
────────────────────────────────`);
if (errors > 0) process.exit(1);
