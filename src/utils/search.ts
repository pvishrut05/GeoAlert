// Search scoring for transit place matching.
// Designed for fast synchronous search over ~400 local records.

// ─── Score tiers (non-overlapping ranges) ────────────────────────────────────
// Exact name match should always win. Within a tier, tiebreakers
// (shorter name, more lines served) determine final order.

const EXACT_NAME = 200;
const EXACT_ALIAS = 180;
const PREFIX_NAME = 150;
const PREFIX_ALIAS = 130;
const WORD_BOUNDARY_NAME = 110; // "lake" matches "Clark/Lake" at the word "Lake"
const WORD_BOUNDARY_ALIAS = 100;
const CONTAINS_NAME = 80;
const CONTAINS_ALIAS = 70;
const EXACT_LINE_CODE = 60;
const PREFIX_LINE_CODE = 50;
const MULTI_WORD_MATCH = 40;
const CITY_MATCH = 10; // intentionally low — city alone is a weak signal

/**
 * Score how well a transit place matches a query.
 * Returns 0 for no match. Higher = better.
 */
export function scoreMatch(
  query: string,
  name: string,
  aliases?: string[],
  lineCodes?: string[],
  city?: string
): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  let best = 0;

  // ── Name matching ──────────────────────────────────────────────────
  best = Math.max(best, scoreText(q, name.toLowerCase()));

  // ── Alias matching (slightly lower tier) ───────────────────────────
  if (aliases?.length) {
    for (const alias of aliases) {
      const s = scoreText(q, alias.toLowerCase());
      // Shift alias scores into alias tier
      if (s >= EXACT_NAME) best = Math.max(best, EXACT_ALIAS);
      else if (s >= PREFIX_NAME) best = Math.max(best, PREFIX_ALIAS);
      else if (s >= WORD_BOUNDARY_NAME) best = Math.max(best, WORD_BOUNDARY_ALIAS);
      else if (s >= CONTAINS_NAME) best = Math.max(best, CONTAINS_ALIAS);
    }
  }

  // Early exit if we already have a strong match
  if (best >= CONTAINS_NAME) return best;

  // ── Line code matching ─────────────────────────────────────────────
  if (lineCodes?.length) {
    for (const code of lineCodes) {
      const cl = code.toLowerCase();
      if (cl === q) { best = Math.max(best, EXACT_LINE_CODE); break; }
      if (cl.startsWith(q)) best = Math.max(best, PREFIX_LINE_CODE);
    }
  }

  if (best > 0) return best;

  // ── Multi-word: all query words appear in name+aliases ─────────────
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const haystack = [name, ...(aliases ?? [])].join(' ').toLowerCase();
    if (words.every((w) => haystack.includes(w))) {
      return MULTI_WORD_MATCH;
    }
  }

  // ── City (weak signal, only if nothing else matched) ───────────────
  if (city && city.toLowerCase().includes(q) && q.length >= 3) {
    return CITY_MATCH;
  }

  return 0;
}

/**
 * Score a query against a single text field.
 * Distinguishes exact, prefix, word-boundary, and substring matches.
 */
function scoreText(query: string, text: string): number {
  if (text === query) return EXACT_NAME;
  if (text.startsWith(query)) return PREFIX_NAME;

  // Word-boundary match: query matches at start of any "word" in the text.
  // Words are split on space, /, -, (, .
  // "lake" matches "Clark/Lake" but not "Blacklake"
  if (matchesWordBoundary(query, text)) return WORD_BOUNDARY_NAME;

  if (text.includes(query)) return CONTAINS_NAME;

  return 0;
}

/** Check if query matches at a word boundary in text. */
function matchesWordBoundary(query: string, text: string): boolean {
  // Split on common transit name delimiters
  const parts = text.split(/[\s/\-\(\).]+/);
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].startsWith(query)) return true;
  }
  return false;
}

/**
 * Tiebreaker score for sorting results with the same primary score.
 * Shorter names, more lines, and CTA (local transit) sort higher.
 */
export function tiebreaker(
  name: string,
  agency?: string,
  lineCodeCount?: number
): number {
  let t = 0;
  // Prefer stations that serve more lines (transfer hubs)
  t += (lineCodeCount ?? 0) * 3;
  // Prefer shorter names (more recognizable)
  t -= name.length * 0.1;
  // Slight CTA preference (urban core, more riders)
  if (agency === 'CTA') t += 1;
  return t;
}

