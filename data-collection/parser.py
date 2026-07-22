"""
parser.py — Parse a single al-hadees.com hadees page into a structured record.

A single hadees lives at a URL like  https://al-hadees.com/<book-slug>/<id>
(e.g. https://al-hadees.com/bukhari/3). The page is server-rendered HTML, so no
JavaScript execution is required — plain requests + BeautifulSoup is enough.

The important pieces of the page and how we locate them:

  * Book (kitab) / Chapter (bab) headers
        Two `<div class="container ...">` blocks near the top, each holding
        an Arabic <h2>, an Urdu <h2>/<h5> and an English <h5>/<h6>.

  * Arabic matn, English translation
        Clean copies live in hidden <textarea> elements whose ids are
        `content-arb-<id>`, `content-eng-<id>` (used by the site's Copy button).

  * Urdu translation(s) with translator name
        A Bootstrap accordion. Each translation is a header <button> containing
        `ترجمہ: <translator name>` whose `data-target` points at a collapse
        panel holding the Urdu text. A hadees may have 1+ Urdu translations.

  * Reference block (numbers + status)
        A card of label-row / value-row pairs:
            "Hadees Number"    -> "International: N"  /  "ترقیم : N"
            "Status"           -> e.g. "Sahih" / "صحیح" (one or more grades)
            "Status Reference" -> free text (Arabic / Urdu / English)
"""

import re
from bs4 import BeautifulSoup

# Marker that identifies an Urdu translator accordion header.
_TARJUMA = "ترجمہ"

# Arabic tashkeel (diacritics) — stripped before keyword matching so that
# "بَابٌ" (with vowel marks) still matches the bare marker "باب".
_TASHKEEL = re.compile(r"[ً-ْٰ]")


def _strip_diacritics(text):
    return _TASHKEEL.sub("", text or "")


# Letters that occur in Urdu but not in classical Arabic. Their presence marks a
# string as Urdu; their absence (in Perso-Arabic script) marks it as Arabic.
_URDU_ONLY = set("ٹڈڑںھہۃیےگچپژک")


def _looks_urdu(text):
    return any(ch in _URDU_ONLY for ch in (text or ""))


def _looks_arabic(text):
    return bool(text) and not _looks_urdu(text)


def _clean(text):
    """Collapse whitespace; return None for empty."""
    if text is None:
        return None
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def _textarea(soup, prefix, hid):
    """Return cleaned text of <textarea id="content-<prefix>-<hid>">, or None."""
    el = soup.find("textarea", id=f"content-{prefix}-{hid}")
    if el is None:
        # Fall back to any textarea whose id starts with the prefix (id in URL
        # occasionally differs from the internal content id).
        el = soup.find("textarea", id=re.compile(rf"^content-{prefix}-\d+$"))
    if el is None:
        return None
    # Preserve paragraph breaks as newlines, then trim each line.
    raw = el.get_text("\n")
    lines = [l.strip() for l in raw.splitlines()]
    out = "\n".join(l for l in lines if l)
    return out or None


def _headers(soup):
    """
    Extract kitab (book) and bab (chapter) headers.

    Returns a dict with kitab_arabic/urdu/english and bab_arabic/urdu/english.
    Everything is best-effort: books without an English name or without chapters
    simply yield None for the missing fields rather than failing.
    """
    result = {
        "kitab_arabic": None, "kitab_urdu": None, "kitab_english": None,
        "bab_arabic": None, "bab_urdu": None, "bab_english": None,
    }

    # The kitab container has an <h2> beginning with "کتاب" (Urdu) or an Arabic
    # book title. The bab container has an <h2> equal to / starting with "باب".
    containers = soup.find_all("div", class_="container")

    def classify(container):
        text = _strip_diacritics(container.get_text(" ", strip=True))
        has_kitab = "کتاب" in text or "كتاب" in text
        has_bab = "باب" in text
        if has_bab and not has_kitab and len(text) < 400:
            return "bab"
        if has_kitab:
            return "kitab"
        return None

    for cont in containers:
        kind = classify(cont)
        if kind is None:
            continue
        heads = [h for h in cont.find_all(["h1", "h2", "h3", "h4", "h5", "h6"])
                 if _clean(h.get_text())]
        arabic = urdu = english = None
        for h in heads:
            t = _clean(h.get_text())
            # Classify by script: Latin => English, Urdu-only letters => Urdu,
            # otherwise Arabic. Font classes are unreliable (Arabic and Urdu
            # share the same font family here).
            if re.search(r"[A-Za-z]", t):
                if english is None:
                    english = t
            elif _looks_urdu(t):
                if urdu is None:
                    urdu = t
            else:
                if arabic is None:
                    arabic = t
        # The page has many <div class="container"> (nav, footer, …). Keep the
        # first container that actually yields header text and do not let a
        # later empty match overwrite it.
        if kind == "kitab" and not any(
                result[k] for k in ("kitab_arabic", "kitab_urdu", "kitab_english")):
            if arabic or urdu or english:
                result["kitab_arabic"] = arabic
                result["kitab_urdu"] = urdu
                result["kitab_english"] = english
        elif kind == "bab" and not any(
                result[k] for k in ("bab_arabic", "bab_urdu", "bab_english")):
            if arabic or urdu or english:
                result["bab_arabic"] = arabic
                result["bab_urdu"] = urdu
                result["bab_english"] = english

    return result


def _urdu_translations(soup):
    """Return a list of {"translator", "text"} for every Urdu translation."""
    out = []
    buttons = soup.find_all(
        lambda t: t.name == "button" and _TARJUMA in t.get_text())
    for b in buttons:
        name = _clean(b.get_text())
        if name:
            # Strip the leading "ترجمہ:" marker, keep the translator name.
            name = re.sub(r"^ترجمہ\s*:?\s*", "", name).strip() or None
        target = b.get("data-target") or b.get("href") or ""
        text = None
        if target.startswith("#"):
            panel = soup.find(id=target[1:])
            if panel is not None:
                node = panel.find(class_=re.compile("font-urdu")) or panel
                # Prefer paragraph-preserving text.
                raw = node.get_text("\n")
                lines = [l.strip() for l in raw.splitlines()]
                text = "\n".join(l for l in lines if l) or None
        out.append({"translator": name, "text": text})
    return out


def _reference_card(soup):
    """
    Locate the reference card (the one holding "International:") and return its
    list of <div class="row"> for label/value scanning.
    """
    anchor = soup.find(string=re.compile("International"))
    if anchor is None:
        return None
    # Walk up to the enclosing column/card that also contains "Status".
    node = anchor
    for _ in range(8):
        node = node.parent
        if node is None:
            return None
        if "Status" in node.get_text():
            return node
    return None


def _row_pairs(card):
    """
    Yield (english_label, value_row) tuples. A label row is a heading like
    "Status" / "Status Reference"; the value row is the next sibling row.
    Simpler: we just return all rows so callers can scan by position.
    """
    return card.find_all("div", class_="row", recursive=True)


def _parse_reference(soup):
    """Extract numbers, status grades and status reference from the card."""
    ref = {
        "international_number": None,
        "arabic_number": None,
        "status": [],
        "status_reference": {"arabic": None, "urdu": None, "english": None},
    }
    card = _reference_card(soup)
    if card is None:
        return ref

    rows = _row_pairs(card)

    # International + Arabic (ترقیم) numbers.
    card_text = card.get_text(" ", strip=True)
    m = re.search(r"International\s*:\s*([0-9٠-٩]+)", card_text)
    if m:
        ref["international_number"] = m.group(1)
    m = re.search(r"ترقیم\s*:?\s*([0-9٠-٩]+)", card_text)
    if m:
        ref["arabic_number"] = m.group(1)

    def cols_text(row):
        cols = row.find_all("div", recursive=False)
        return [_clean(c.get_text(" ", strip=True)) for c in cols]

    # Scan rows: when we hit a heading row, the following row holds the values.
    for i, row in enumerate(rows):
        label = _clean(row.get_text(" ", strip=True)) or ""
        # "Status" heading -> next row = grade pairs (english left / urdu right)
        if re.match(r"^Status\b", label) and "Reference" not in label:
            if i + 1 < len(rows):
                vals = cols_text(rows[i + 1])
                # Values come in pairs: [eng, urdu, eng, urdu, ...]. The primary
                # hukm is the first pair. Extra pairs are only kept when they
                # look like a grade (short English token) — this filters out the
                # long Takhreej (per-scholar grading) text that some books stack
                # into the same row.
                for j in range(0, len(vals), 2):
                    eng = vals[j] if j < len(vals) else None
                    urd = vals[j + 1] if j + 1 < len(vals) else None
                    if eng and len(eng) < 40:
                        ref["status"].append({"english": eng, "urdu": urd})
        elif "Status Reference" in label:
            if i + 1 < len(rows):
                vals = [v for v in cols_text(rows[i + 1]) if v]
                # Heuristic: classify each value by script.
                for v in vals:
                    if re.search(r"[A-Za-z]", v) and ref["status_reference"]["english"] is None:
                        ref["status_reference"]["english"] = v
                    elif _looks_arabic(v) and ref["status_reference"]["arabic"] is None:
                        ref["status_reference"]["arabic"] = v
                    elif ref["status_reference"]["urdu"] is None:
                        ref["status_reference"]["urdu"] = v
    return ref


def parse_hadees(html, url=None, book_slug=None, book_name=None, hid=None):
    """
    Parse a single-hadees HTML page into a dict.

    Returns None if the page carries no hadees (e.g. an out-of-range id, which
    the site serves as HTTP 200 with an empty body).
    """
    soup = BeautifulSoup(html, "lxml")

    if hid is None and url:
        m = re.search(r"/(\d+)/?$", url)
        hid = int(m.group(1)) if m else None

    ref = _parse_reference(soup)
    arabic = _textarea(soup, "arb", hid)

    # A valid hadees page has at least an Arabic matn or an International number.
    if arabic is None and ref["international_number"] is None:
        return None

    urdu = _urdu_translations(soup)
    record = {
        "book_slug": book_slug,
        "book_name": book_name,
        "url": url,
        "id": hid,
        "international_number": ref["international_number"],
        "arabic_number": ref["arabic_number"],
        "arabic": arabic,
        "urdu": urdu,
        "urdu_first": urdu[0] if urdu else None,
        "english": _textarea(soup, "eng", hid),
        "status": ref["status"],
        "status_reference": ref["status_reference"],
    }
    record.update(_headers(soup))
    return record
