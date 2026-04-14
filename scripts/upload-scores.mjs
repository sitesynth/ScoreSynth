/**
 * Bulk score uploader — ScoreSynth
 *
 * Usage:
 *   node scripts/upload-scores.mjs <path-to-folder>
 *
 * Filename format:
 *   <category>_<title words separated by underscores>.pdf
 *   Examples:
 *     piano_beethoven_sonata_14.pdf   → category: piano,  title: "Beethoven Sonata 14"
 *     strings_bach_chaconne.pdf       → category: strings, title: "Bach Chaconne"
 *     choir_handel_messiah.pdf        → category: choir,  title: "Handel Messiah"
 *
 * Categories: piano, brass, strings, symphonic, guitar, choir
 * If the prefix is not a known category, defaults to "piano".
 *
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY must be set in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "fs/promises";
import { resolve, extname, basename, dirname } from "path";
import { fileURLToPath } from "url";
import { createReadStream } from "fs";

// ─── Read .env.local ──────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
let envText = "";
try { envText = await readFile(envPath, "utf8"); } catch {}

function getEnv(key) {
  const match = envText.match(new RegExp(`^${key}=(.+)$`, "m"));
  return match ? match[1].trim() : process.env[key] ?? "";
}

const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY  = getEnv("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL not found in .env.local");
  process.exit(1);
}
if (!SERVICE_KEY || SERVICE_KEY === "your_service_role_key") {
  console.error("❌  SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  console.error("    Supabase Dashboard → Project Settings → API → service_role key");
  process.exit(1);
}

// ─── Config ───────────────────────────────────────────────────────────────────
const ADMIN_HANDLE = "mayyascoresynth";
const CATEGORIES = ["piano", "strings", "woodwinds", "brass", "chamber", "symphonic", "guitar", "choir", "percussion", "soundtracks"];

const folderPath = process.argv[2];
if (!folderPath) {
  console.error("Usage: node scripts/upload-scores.mjs <folder-path>");
  process.exit(1);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseFilename(filename) {
  const name   = basename(filename, extname(filename));
  const parts  = name.replace(/[-\s]+/g, "_").split("_").filter(Boolean);
  const first  = parts[0]?.toLowerCase() ?? "";
  const isKnownCategory = CATEGORIES.includes(first);
  const category    = isKnownCategory ? first : "piano";
  const titleParts  = isKnownCategory ? parts.slice(1) : parts;
  const title = titleParts
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ") || name;
  return { category, title };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Find the admin's user ID via their profile handle
const { data: profile, error: profileErr } = await supabase
  .from("profiles")
  .select("id")
  .eq("handle", ADMIN_HANDLE)
  .single();

if (profileErr || !profile) {
  console.error(`❌  Admin profile '${ADMIN_HANDLE}' not found: ${profileErr?.message}`);
  process.exit(1);
}
const authorId = profile.id;

// Read PDFs from folder
const allFiles = await readdir(resolve(folderPath));
const pdfs = allFiles.filter(f => extname(f).toLowerCase() === ".pdf");

if (pdfs.length === 0) {
  console.log("No PDF files found in the folder.");
  process.exit(0);
}

console.log(`\nFound ${pdfs.length} PDF${pdfs.length !== 1 ? "s" : ""} in: ${folderPath}\n`);
console.log("Category  Title");
console.log("─────────────────────────────────────────────────────");
pdfs.forEach(f => {
  const { category, title } = parseFilename(f);
  console.log(`${category.padEnd(10)}${title}`);
});
console.log();

// Confirm
const readline = await import("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const answer = await new Promise(res => rl.question(`Upload all ${pdfs.length} scores? (y/n) `, res));
rl.close();

if (answer.trim().toLowerCase() !== "y") {
  console.log("Cancelled.");
  process.exit(0);
}

console.log();
let ok = 0, fail = 0;

for (let i = 0; i < pdfs.length; i++) {
  const filename = pdfs[i];
  const { category, title } = parseFilename(filename);
  const prefix = `[${i + 1}/${pdfs.length}]`;
  process.stdout.write(`${prefix} ${title} (${category})… `);

  const filePath = resolve(folderPath, filename);
  const buffer   = await readFile(filePath);
  const ts       = Date.now() + i; // ensure unique timestamps
  const pdfPath  = `${authorId}/${ts}-${filename}`;

  // Upload PDF to storage
  const { error: storageErr } = await supabase.storage
    .from("score-files")
    .upload(pdfPath, buffer, { contentType: "application/pdf", upsert: false });

  if (storageErr) {
    console.log(`FAIL ❌  (${storageErr.message})`);
    fail++;
    continue;
  }

  // Insert score record
  const { error: dbErr } = await supabase.from("scores").insert({
    title,
    composer:      "",
    publisher:     "",
    description:   "",
    difficulty:    "Intermediate",
    category,
    instruments:   [],
    tag:           "free",
    price_display: null,
    pages:         1,
    pdf_url:       pdfPath,
    cover_url:     null,   // cover will be auto-generated next time the score is edited in admin
    author_id:     authorId,
  });

  if (dbErr) {
    console.log(`FAIL ❌  (${dbErr.message})`);
    fail++;
  } else {
    console.log("OK ✓");
    ok++;
  }

  // Small delay to avoid overwhelming the API
  await new Promise(r => setTimeout(r, 150));
}

console.log(`\n${"─".repeat(50)}`);
console.log(`Done: ${ok} uploaded ✓,  ${fail} failed ✗`);
if (fail > 0) {
  console.log("Re-run the script — already uploaded files won't be duplicated (upsert: false).");
}
