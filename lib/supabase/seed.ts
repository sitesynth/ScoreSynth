/**
 * ScoreSynth — Seed Script
 *
 * Run ONCE after setting up the Supabase database schema.
 *
 * Steps:
 * 1. Create each mock author as a real user in Supabase Auth Dashboard
 *    (Authentication > Users > Invite User) — or use signUp from the SDK.
 * 2. After users are created, copy their UUIDs into AUTHOR_ID_MAP below.
 * 3. Run: npx ts-node -r tsconfig-paths/register lib/supabase/seed.ts
 *
 * Alternatively, you can paste the generated SQL directly into the
 * Supabase SQL Editor (set GENERATE_SQL = true below).
 */

import { createClient } from "@supabase/supabase-js";
import { ALL_SCORES } from "../scores";

const GENERATE_SQL = false; // set true to print INSERT SQL instead of running

// ── Fill these in after creating seed users in Supabase Auth ──
const AUTHOR_ID_MAP: Record<string, string> = {
  elena_m:             "REPLACE_WITH_UUID",
  sofia_r:             "REPLACE_WITH_UUID",
  diego_f:             "REPLACE_WITH_UUID",
  james_o:             "REPLACE_WITH_UUID",
  chloe_d:             "REPLACE_WITH_UUID",
  anna_l:              "REPLACE_WITH_UUID",
  brass_collective:    "REPLACE_WITH_UUID",
  mark_t:              "REPLACE_WITH_UUID",
  ryan_w:              "REPLACE_WITH_UUID",
  dirk:                "REPLACE_WITH_UUID",
  scoresynth_official: "REPLACE_WITH_UUID",
};

// Seed profile display names & bios
const PROFILE_META: Record<string, { display_name: string; bio: string; location: string; website: string }> = {
  dirk: {
    display_name: "Dirk Maes",
    bio: "Brass arranger & music educator based in Antwerp. Passionate about making orchestral music accessible to everyone.",
    location: "Antwerp, Belgium",
    website: "dirkmaes.be",
  },
  scoresynth_official: {
    display_name: "ScoreSynth",
    bio: "Official ScoreSynth account. Premium curated scores for every instrument.",
    location: "Brussels, Belgium",
    website: "scoresynth.com",
  },
  elena_m: { display_name: "Elena M.", bio: "", location: "", website: "" },
  sofia_r: { display_name: "Sofia R.", bio: "", location: "", website: "" },
  diego_f: { display_name: "Diego F.", bio: "", location: "", website: "" },
  james_o: { display_name: "James O.", bio: "", location: "", website: "" },
  chloe_d: { display_name: "Chloe D.", bio: "", location: "", website: "" },
  anna_l:  { display_name: "Anna L.", bio: "", location: "", website: "" },
  brass_collective: { display_name: "Brass Collective", bio: "Community brass arrangers.", location: "", website: "" },
  mark_t:  { display_name: "Mark T.", bio: "", location: "", website: "" },
  ryan_w:  { display_name: "Ryan W.", bio: "", location: "", website: "" },
};

async function runSeed() {
  if (GENERATE_SQL) {
    printSeedSQL();
    return;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // service role bypasses RLS
  );

  // 1. Update profile metadata for seed users
  for (const [handle, meta] of Object.entries(PROFILE_META)) {
    const id = AUTHOR_ID_MAP[handle];
    if (id === "REPLACE_WITH_UUID") {
      console.warn(`⚠ Skipping profile update for "${handle}" — UUID not set`);
      continue;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: meta.display_name,
        bio: meta.bio,
        location: meta.location,
        website: meta.website,
      })
      .eq("id", id);
    if (error) console.error(`Profile update failed for "${handle}":`, error.message);
    else console.log(`✓ Profile updated: ${handle}`);
  }

  // 2. Insert scores
  for (const s of ALL_SCORES) {
    const authorId = AUTHOR_ID_MAP[s.author];
    if (!authorId || authorId === "REPLACE_WITH_UUID") {
      console.warn(`⚠ Skipping "${s.title}" — author UUID for "${s.author}" not set`);
      continue;
    }
    const { error } = await supabase.from("scores").insert({
      title:         s.title,
      composer:      s.composer,
      publisher:     s.publisher,
      description:   s.description,
      difficulty:    s.difficulty,
      category:      s.category,
      instruments:   s.instruments,
      tag:           s.tag,
      price_display: s.price ?? null,
      likes_count:   s.likes,
      views_count:   s.views,
      pages:         s.pages,
      author_id:     authorId,
    });
    if (error) console.error(`Failed to seed "${s.title}":`, error.message);
    else console.log(`✓ Seeded score: ${s.title}`);
  }

  console.log("\nSeed complete.");
}

function printSeedSQL() {
  console.log("-- Paste into Supabase SQL Editor");
  console.log("-- Replace UUIDs with real values from auth.users\n");
  for (const s of ALL_SCORES) {
    const authorId = AUTHOR_ID_MAP[s.author] ?? "00000000-0000-0000-0000-000000000000";
    const esc = (v: string) => v.replace(/'/g, "''");
    const instruments = `'{${s.instruments.map(i => `"${i}"`).join(",")}}'`;
    console.log(
      `INSERT INTO public.scores (title, composer, publisher, description, difficulty, category, instruments, tag, price_display, likes_count, views_count, pages, author_id) VALUES ` +
      `('${esc(s.title)}', '${esc(s.composer)}', '${esc(s.publisher)}', '${esc(s.description)}', '${s.difficulty}', '${s.category}', ${instruments}, '${s.tag}', ${s.price ? `'${s.price}'` : "NULL"}, ${s.likes}, ${s.views}, ${s.pages}, '${authorId}');`
    );
  }
}

runSeed().catch(console.error);
