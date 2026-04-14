/**
 * Run this from your Scores folder:
 *   node "C:\Users\mayya\Desktop\SITES\ScoreSynth\generate-csv.js" .
 *
 * Or pass the path to your Scores folder:
 *   node "C:\Users\mayya\Desktop\SITES\ScoreSynth\generate-csv.js" "C:\Users\mayya\Music\Scores"
 */

const fs = require("fs");
const path = require("path");

const dir = process.argv[2] || ".";

function guessMetadata(filename) {
  const name = path.basename(filename, ".pdf");
  const lower = name.toLowerCase();

  let composer = "";
  let title = "";
  let category = "strings";
  let instruments = "";

  // ── Libertango / Piazzolla ──────────────────────────────────────────────────
  if (lower.includes("libertango") || lower.includes("piazzola") || lower.includes("piazollo")) {
    composer = "Astor Piazzolla";

    if (lower.includes("solo") && lower.includes("piano")) {
      title = "Libertango (Solo Piano)"; category = "piano"; instruments = "Piano";
    } else if (lower.includes("bassoon")) {
      title = "Libertango (Bassoon & Piano)"; instruments = "Bassoon, Piano";
    } else if (lower.includes("cello") && lower.includes("piano")) {
      title = "Libertango (Cello & Piano)"; instruments = "Cello, Piano";
    } else if (lower.includes("clarinet")) {
      title = "Libertango (Clarinet & Piano)"; instruments = "Clarinet, Piano";
    } else if (lower.includes("gitflute") || (lower.includes("git") && lower.includes("flute"))) {
      title = "Libertango (Guitar & Flute)"; instruments = "Guitar, Flute";
    } else if (lower.includes("flute") && lower.includes("piano")) {
      title = "Libertango (Flute & Piano)"; instruments = "Flute, Piano";
    } else if (lower.includes("flute")) {
      title = "Libertango (Flute)"; instruments = "Flute";
    } else if (lower.includes("horn")) {
      title = "Libertango (Horn)"; category = "brass"; instruments = "Horn";
    } else if (lower.includes("oboe")) {
      title = "Libertango (Oboe)"; instruments = "Oboe";
    } else if (lower.includes("satb")) {
      title = "Libertango (SATB Choir)"; category = "choir"; instruments = "SATB Choir";
    } else if (lower.includes("ssa")) {
      title = "Libertango (SSA Choir)"; category = "choir"; instruments = "SSA Choir";
    } else if (lower.includes("brass")) {
      title = "Libertango (Brass Ensemble)"; category = "brass"; instruments = "Brass Ensemble";
    } else if (lower.includes("wind") && lower.includes("quintet")) {
      title = "Libertango (Wind Quintet)"; instruments = "Wind Quintet";
    } else if (lower.includes("string")) {
      title = "Libertango (String Quartet)"; instruments = "Strings";
    } else if (lower.includes("quartet") || lower.includes("qua")) {
      title = "Libertango (Quartet)"; instruments = "Quartet";
    } else if (lower.includes("partitura")) {
      title = "Libertango (Full Score)"; category = "symphonic"; instruments = "Orchestra";
    } else if (lower.includes("arranged")) {
      title = "Libertango (Arranged)";
    } else if (lower.includes("piano")) {
      title = "Libertango (Piano)"; category = "piano"; instruments = "Piano";
    } else {
      title = "Libertango";
    }

  // ── Taganov ─────────────────────────────────────────────────────────────────
  } else if (lower.includes("taganov")) {
    composer = "O. Taganov";
    title = "Fantasy on Libertango Themes";
    category = "piano";
    instruments = "Piano";

  // ── Flute Quartet ────────────────────────────────────────────────────────────
  } else if (lower.includes("flute") && lower.includes("quartet")) {
    title = "Flute Quartet";
    category = "strings";
    instruments = "Flute Quartet";

  } else if (lower.includes("flutepiano") || (lower.includes("flute") && lower.includes("piano"))) {
    title = "Flute & Piano";
    category = "strings";
    instruments = "Flute, Piano";

  // ── Julius Röntgen ──────────────────────────────────────────────────────────
  } else if (lower.includes("julius") || lower.includes("r\u00f6ntgen") || lower.includes("rontgen")) {
    composer = "Julius Röntgen";
    title = name.replace(/julius\s*r[oö]ntgen\d*/i, "").replace(/[-_]/g, " ").trim() || "Julius Röntgen";
    category = "strings";

  // ── Ensemble ────────────────────────────────────────────────────────────────
  } else if (lower.includes("ensemble")) {
    title = "Ensemble Piece";
    category = "symphonic";
    instruments = "Ensemble";

  // ── Piano / Piano Duo ────────────────────────────────────────────────────────
  } else if (lower.startsWith("piano") || lower.includes("pianoduo")) {
    category = "piano";
    instruments = lower.includes("duo") ? "Piano 4-hands" : "Piano";
    title = lower.includes("duo") ? "Piano Duo" : "Piano Piece";

  // ── Kreutz ───────────────────────────────────────────────────────────────────
  } else if (lower.includes("kreutz")) {
    title = name.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    category = "strings";

  // ── Generic fallback ─────────────────────────────────────────────────────────
  } else {
    title = name.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  // Wrap fields that might contain commas in quotes
  const q = (v) => (String(v).includes(",") ? `"${v}"` : v);

  return [
    q(filename),
    q(title || name),
    q(composer),
    "",               // publisher
    "",               // description
    category,
    "Intermediate",
    q(instruments),
    "free",
    "",               // price_display
    "1",              // pages
  ].join(",");
}

const pdfs = fs.readdirSync(dir)
  .filter(f => f.toLowerCase().endsWith(".pdf"))
  .sort();

if (pdfs.length === 0) {
  console.error("No PDF files found in:", path.resolve(dir));
  process.exit(1);
}

const header = "filename,title,composer,publisher,description,category,difficulty,instruments,tag,price_display,pages";
const rows = pdfs.map(guessMetadata);
const csv = [header, ...rows].join("\n");

const out = path.join(dir, "scores_metadata.csv");
fs.writeFileSync(out, csv, "utf8");
console.log(`Done! ${pdfs.length} scores written to: ${out}`);
