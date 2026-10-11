#!/usr/bin/env node
// One-off: copy what cornellec.com already knows about a member into their
// dashboard profile, so nobody has to retype a bio they wrote last year.
//
//   node scripts/backfill-site-members.mjs --site ../CEC-website           (dry run)
//   node scripts/backfill-site-members.mjs --site ../CEC-website --apply   (write)
//
// Reads data/members.ts from the site checkout (plain string literals, so a
// small parser is enough, no TypeScript toolchain needed), matches people to
// `profiles` by normalised full name, and fills ONLY empty fields. Position
// is filled only while it is still the default "Member". The site photo is
// uploaded as the avatar only when the profile has none. Prints the names it
// could not match: those are the people an admin still has to invite.
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, read from
// .env.local by default (pass --env <file> for another).

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : (args[i + 1] ?? true);
};
const sitePath = flag("--site");
const apply = args.includes("--apply");
const envFile = flag("--env") ?? ".env.local";
if (!sitePath) {
  console.error("usage: node scripts/backfill-site-members.mjs --site <path to CEC-website> [--apply]");
  process.exit(1);
}

for (const line of readFileSync(envFile, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(`Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in ${envFile}`);
  process.exit(1);
}

// --- parse data/members.ts ---------------------------------------------------
const source = readFileSync(join(sitePath, "data", "members.ts"), "utf8");
const LISTS = ["coPresidents", "executiveBoard", "members", "presidentsEmeriti", "alumni"];
const siteMembers = [];
for (const list of LISTS) {
  const start = source.indexOf(`export const ${list}`);
  if (start === -1) continue;
  const open = source.indexOf("[", start);
  const close = source.indexOf("\n];", open);
  const body = source.slice(open, close);
  // Each member is a { ... } literal of key: "string" pairs.
  for (const block of body.matchAll(/\{([^{}]*)\}/g)) {
    const entry = { list };
    for (const pair of block[1].matchAll(/(\w+):\s*"((?:[^"\\]|\\.)*)"/g)) {
      entry[pair[1]] = pair[2].replace(/\\"/g, '"');
    }
    if (entry.name) siteMembers.push(entry);
  }
}
console.log(`site: ${siteMembers.length} people in ${LISTS.join(", ")}`);

const normalise = (name) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s*'\d{2}$/, "")
    .replace(/\(.*?\)/g, "")
    .split(",")[0]
    .replace(/\s+/g, " ")
    .trim();

// --- load profiles -----------------------------------------------------------
const supabase = createClient(url, key, { auth: { persistSession: false } });
const { data: profiles, error } = await supabase
  .from("profiles")
  .select("id, email, full_name, avatar_url, position, major, graduation_year, hobbies, about, building, portfolio_url, github_url, linkedin_url");
if (error) {
  console.error("couldn't read profiles:", error.message);
  process.exit(1);
}
const byName = new Map();
for (const p of profiles) if (p.full_name) byName.set(normalise(p.full_name), p);

const empty = (v) => v === null || v === undefined || v === "";
const withScheme = (v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);

let matched = 0;
const unmatched = [];
for (const m of siteMembers) {
  const profile = byName.get(normalise(m.name));
  if (!profile) {
    unmatched.push(`${m.name} (${m.list})`);
    continue;
  }
  matched += 1;
  const patch = {};
  if (empty(profile.major) && m.major) patch.major = m.major;
  if (empty(profile.graduation_year) && m.year && /^\d{4}$/.test(m.year)) patch.graduation_year = Number(m.year);
  if (empty(profile.hobbies) && m.hobbies) patch.hobbies = m.hobbies;
  if (empty(profile.about) && m.about) patch.about = m.about;
  if (empty(profile.building) && m.building) patch.building = m.building;
  if (empty(profile.portfolio_url) && m.portfolio) patch.portfolio_url = withScheme(m.portfolio);
  if (empty(profile.github_url) && m.github) patch.github_url = withScheme(m.github);
  if (empty(profile.linkedin_url) && m.linkedin) patch.linkedin_url = withScheme(m.linkedin);
  if ((empty(profile.position) || profile.position === "Member") && m.role) patch.position = m.role;

  // A Google sign-in avatar is whatever Google had on file, usually a letter
  // tile. The site photo is a chosen headshot, so it replaces that too. A
  // photo someone uploaded here themselves (portraits bucket) is kept.
  const replaceableAvatar =
    empty(profile.avatar_url) || /googleusercontent\.com/.test(profile.avatar_url);
  let avatarNote = "";
  if (replaceableAvatar && m.image) {
    const file = join(sitePath, "public", m.image);
    if (existsSync(file)) {
      avatarNote = ` + photo ${m.image}`;
      if (apply) {
        const path = `avatars/${profile.id}/site.webp`;
        const ext = m.image.split(".").pop().toLowerCase();
        const contentType = ext === "webp" ? "image/webp" : ext === "png" ? "image/png" : "image/jpeg";
        const { error: upErr } = await supabase.storage
          .from("portraits")
          .upload(path, readFileSync(file), { contentType, upsert: true });
        if (upErr) console.warn(`  photo upload failed for ${m.name}: ${upErr.message}`);
        else patch.avatar_url = `${url}/storage/v1/object/public/portraits/${path}`;
      }
    } else {
      avatarNote = ` (photo missing on disk: ${m.image})`;
    }
  }

  const fields = Object.keys(patch);
  console.log(`${apply ? "WRITE" : "would write"} ${m.name} -> ${profile.email}: ${fields.length ? fields.join(", ") : "nothing"}${avatarNote}`);
  if (apply && fields.length) {
    const { error: updErr } = await supabase.from("profiles").update(patch).eq("id", profile.id);
    if (updErr) console.warn(`  update failed: ${updErr.message}`);
  }
}

console.log(`\nmatched ${matched} of ${siteMembers.length}.`);
if (unmatched.length) {
  console.log(`no dashboard account yet (invite them from /admin, then rerun):\n  ${unmatched.join("\n  ")}`);
}
if (!apply) console.log("\ndry run. Add --apply to write.");
