import type { Edition, Hadith } from "@/lib/api/client";
import { DEFAULT_EDITIONS } from "@/lib/api/client";

/** Render a number with Arabic-Indic numerals (٠١٢…), as used in print. */
export function toArabicDigits(n: number | string): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

/** Strip the "HZ"/"HK"/"HY"/… prefix from a UCI, leaving the numeric part. */
export function uciNumber(uci: string): number {
  return Number(uci.replace(/\D/g, ""));
}

/**
 * Build an API identifier from path segments. The API splits on the last
 * colon, so parts compose to any depth: ("bukhari", 3, 5) → "bukhari:3:5".
 */
export function composeIdentifier(
  ...parts: (string | number | undefined)[]
): string {
  return parts.filter((p) => p !== undefined && p !== "").join(":");
}

/**
 * Decode a dynamic route param before handing it to the API.
 *
 * Next delivers path params still percent-encoded, so "/hadiths/bukhari:100"
 * arrives as "bukhari%3A100". The client encodes path params again on the way
 * out, and the double encoding stops the API resolving the citation. The
 * identifier grammar never contains a literal "%", so decoding is safe.
 */
export function decodeIdentifier(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    // Malformed escape sequence — hand it over untouched and let the API 404.
    return raw;
  }
}

/** How much weight a grade carries. `grade` is free text, so match loosely. */
export type GradeTone = "sound" | "good" | "weak" | "other";

export function gradeTone(grade: string): GradeTone {
  if (grade.includes("ضعيف") || grade.includes("ضعیف")) return "weak";
  if (grade.includes("صحيح") || grade.includes("صحیح")) return "sound";
  if (grade.includes("حسن")) return "good";
  return "other";
}

/**
 * How a hadith is cited: its UCI, and the human form scholars actually use.
 * Variant narrations keep the dotted source number the API accepts, so
 * "aladab-almufarrad:270.1" round-trips back to HA270A.
 */
export function citationOf(
  hadith: Pick<Hadith, "uci" | "number" | "subNumber">,
  bookSlug?: string,
): { uci: string; human?: string } {
  if (!bookSlug) return { uci: hadith.uci };
  const number =
    hadith.subNumber > 0
      ? `${hadith.number}.${hadith.subNumber}`
      : hadith.number;
  return { uci: hadith.uci, human: `${bookSlug}:${number}` };
}

/**
 * Turn a `?edition=` CSV into editions in the requested order, ignoring
 * anything the corpus does not have. Falls back to Arabic plus Urdu.
 */
export function resolveEditions(all: Edition[], csv?: string): Edition[] {
  const bySlug = new Map(all.map((e) => [e.slug, e]));
  const wanted = (csv ?? DEFAULT_EDITIONS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const resolved = wanted
    .map((slug) => bySlug.get(slug))
    .filter((e): e is Edition => e !== undefined);
  return resolved.length > 0
    ? resolved
    : all.filter((e) => e.type === "original");
}

/** Latin counts are apparatus, so they get thousands separators and tabular figures. */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** A count with its noun agreeing — "1 narration", "7,563 narrations". */
export function pluralize(
  n: number,
  singular: string,
  plural = `${singular}s`,
): string {
  return `${formatCount(n)} ${n === 1 ? singular : plural}`;
}

/** Canonical permalink for a hadith. */
export function hadithHref(uci: string): string {
  return `/hadiths/${uci}`;
}

/*
 * Reader URLs mirror the corpus hierarchy in plain segments, which the routes
 * recompose into the API's colon grammar. Kept here so every link in the app
 * is built one way.
 */

export function bookHref(slug: string): string {
  return `/books/${slug}`;
}

export function kitabHref(slug: string, numberInBook: number): string {
  return `/books/${slug}/${numberInBook}`;
}

export function baabHref(
  slug: string,
  numberInBook: number,
  numberInKitab: number,
): string {
  return `/books/${slug}/${numberInBook}/${numberInKitab}`;
}
