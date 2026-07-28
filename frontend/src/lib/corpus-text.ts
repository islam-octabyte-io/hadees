export type CorpusSegment = {
  kind: "text" | "heading";
  value: string;
};

/**
 * The Urdu edition carries a little markup from the printed volumes it was
 * digitised from: `<br>` where a paragraph breaks, and
 * `<span class="heading-color">` around a commentary heading such as
 * "تشریح :". About a third of the corpus's text rows contain one or the other,
 * and left alone they render as literal angle brackets in the middle of the
 * translation.
 *
 * Only those two tags are touched. Angle brackets are *also* used as quotation
 * marks around Arabic speech in this corpus — `<، قَالَ: أَصَبْتُ أَهْلِي>` — so anything
 * that stripped tags generically would eat the matn. Nothing is ever rendered
 * as HTML; markup becomes structure, which is what the rubric is for.
 */
const MARKUP = /<br\s*\/?>|<\/?span[^>]*>/gi;

export function parseCorpusText(raw: string): CorpusSegment[] {
  const segments: CorpusSegment[] = [];
  let cursor = 0;
  let inHeading = false;

  const push = (kind: CorpusSegment["kind"], value: string) => {
    if (!value) return;
    const previous = segments.at(-1);
    if (previous?.kind === kind) previous.value += value;
    else segments.push({ kind, value });
  };

  for (const match of raw.matchAll(MARKUP)) {
    const tag = match[0];
    push(inHeading ? "heading" : "text", raw.slice(cursor, match.index));
    cursor = match.index + tag.length;

    if (/^<br/i.test(tag)) {
      push("text", "\n");
    } else if (/^<span/i.test(tag)) {
      inHeading = /heading-color/i.test(tag);
    } else {
      // Closing </span>.
      inHeading = false;
    }
  }
  push(inHeading ? "heading" : "text", raw.slice(cursor));

  // Collapse the blank-line runs the source's stray breaks leave behind.
  for (const segment of segments) {
    segment.value = segment.value.replace(/[ \t]*\n[ \t]*(\n[ \t]*)+/g, "\n\n");
  }

  const first = segments.at(0);
  if (first) first.value = first.value.replace(/^\s+/, "");
  const last = segments.at(-1);
  if (last) last.value = last.value.replace(/\s+$/, "");

  return segments.filter((segment) => segment.value !== "");
}
