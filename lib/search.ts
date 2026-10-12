// Pure helpers behind /search. The page runs one query per result type through
// the caller's session client, so RLS decides what each person sees; these
// only shape the term going in and the text coming out.

/** How many rows each section asks for. Enough to scan, small enough to stay fast. */
export const SEARCH_LIMIT_PER_TYPE = 20;

/**
 * Turns raw input into a term that is safe inside a PostgREST `.or()` filter.
 *
 * `,` `(` `)` are the filter syntax's own separators, `"` and `\` are its
 * quoting, and `*` `%` are wildcards, so all of them become spaces. Without
 * this a search for `a,role.eq.admin` would add a filter clause of its own.
 * Whitespace is collapsed so the term reads the way it was typed.
 */
export function sanitizeSearchTerm(raw: string): string {
  return raw
    .replace(/[,()"\\*%]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

/** Builds `col.ilike.%term%,col2.ilike.%term%` for `.or()`. Expects a sanitized term. */
export function ilikeAny(columns: readonly string[], term: string): string {
  return columns.map((column) => `${column}.ilike.%${term}%`).join(",");
}

/**
 * A short excerpt of `text` around the first case-insensitive hit of `term`,
 * cut on word boundaries, so a note matched deep in its body shows why it
 * matched instead of its first line. Falls back to the opening when the hit
 * is in the title rather than the body.
 */
export function snippetAround(text: string, term: string, radius = 70): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return "";
  const hit = term ? flat.toLowerCase().indexOf(term.toLowerCase()) : -1;

  if (hit < 0 || flat.length <= radius * 2) {
    if (flat.length <= radius * 2) return flat;
    const cut = flat.slice(0, radius * 2);
    const space = cut.lastIndexOf(" ");
    return `${cut.slice(0, space > radius ? space : cut.length)}…`;
  }

  let start = Math.max(0, hit - radius);
  let end = Math.min(flat.length, hit + term.length + radius);
  if (start > 0) {
    const space = flat.indexOf(" ", start);
    if (space !== -1 && space < hit) start = space + 1;
  }
  if (end < flat.length) {
    const space = flat.lastIndexOf(" ", end);
    if (space > hit + term.length) end = space;
  }
  return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
}
