"""
scrape.py — Scrape hadees from al-hadees.com and save them as JSON Lines.

Strategy
--------
Every hadees has a stable, sequential URL:  /<book-slug>/<id>  with ids running
1..count (count = the "N Narrations" figure on the book landing page). The
single-hadees page carries its own book (kitab) and chapter (bab) context, so we
do not need to crawl the intermediate listing pages — we simply walk the ids.
Out-of-range ids are served as HTTP 200 with an empty body; the parser returns
None for those, and we stop after a few consecutive empties past the count.

Output
------
One file per book:  data/<slug>.jsonl  — one JSON object per line. This format
is append-friendly, so scraping is fully resumable: on restart we read the ids
already present and skip them.

Usage
-----
    python scrape.py                     # scrape every book in books.json
    python scrape.py bukhari muslim      # scrape only these books
    python scrape.py bukhari --limit 20  # first 20 ids of bukhari (smoke test)
    python scrape.py --delay 1.0         # be gentler (1s between requests)

Fields captured per hadees are documented in parser.py.
"""

import argparse
import json
import os
import sys
import time

from fetcher import Fetcher, BASE_URL
from parser import parse_hadees
from discover import load_books, build as build_books

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")

# How many consecutive empty (out-of-range) pages to tolerate before deciding a
# book is exhausted. Guards against off-by-a-little counts and small gaps.
STOP_AFTER_EMPTY = 5


def out_path(slug):
    return os.path.join(DATA_DIR, f"{slug}.jsonl")


# Track the length of the last progress line so we can fully overwrite it.
_last_len = 0


def _progress(slug, hid, upper, saved, skipped, failed, started, note="",
              newline=False):
    """
    Print a single, live-updating progress line to stderr.

    On a terminal the line rewrites itself in place (carriage return); when
    output is redirected to a file/pipe we emit a normal line every so often so
    logs stay readable.
    """
    global _last_len
    elapsed = max(time.time() - started, 1e-6)
    rate = (saved + skipped + failed) / elapsed  # pages/sec this run
    pct = f"{100 * hid / upper:5.1f}%" if upper else "  ?  "
    total = str(upper) if upper else "?"
    line = (f"  {slug:<26} {hid:>6}/{total:<6} {pct}  "
            f"saved {saved:<6} skip {skipped:<5} fail {failed:<3} "
            f"{rate:4.1f}/s  {note}")

    is_tty = sys.stderr.isatty()
    if is_tty and not newline:
        pad = max(_last_len - len(line), 0)
        sys.stderr.write("\r" + line + " " * pad)
        sys.stderr.flush()
        _last_len = len(line)
    elif newline:
        # Finish the in-place line (TTY) or emit a summary line (non-TTY).
        if is_tty:
            pad = max(_last_len - len(line), 0)
            sys.stderr.write("\r" + line + " " * pad + "\n")
        else:
            sys.stderr.write(line + "\n")
        sys.stderr.flush()
        _last_len = 0
    else:
        # Non-TTY (redirected / background): print the first processed item and
        # then every 25, so logs show progress early without being spammed.
        processed = saved + skipped + failed
        if processed == 1 or processed % 25 == 0:
            sys.stderr.write(line + "\n")
            sys.stderr.flush()


def already_scraped(slug):
    """Return the set of hadees ids already saved for this book."""
    path = out_path(slug)
    done = set()
    if not os.path.exists(path):
        return done
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
            except json.JSONDecodeError:
                continue
            if rec.get("id") is not None:
                done.add(rec["id"])
    return done


def scrape_book(fetcher, book, limit=None):
    """Scrape a single book, appending new records to its JSONL file."""
    slug = book["slug"]
    name = book["name"]
    count = book.get("count") or 0
    os.makedirs(DATA_DIR, exist_ok=True)

    done = already_scraped(slug)
    upper = min(count, limit) if limit else count
    print(f"\n=== {name} ({slug}) — {count} narrations, "
          f"{len(done)} already saved ===", file=sys.stderr)

    started = time.time()
    saved = skipped = failed = 0
    empty_streak = 0
    hid = 0
    path = out_path(slug)
    with open(path, "a", encoding="utf-8") as fh:
        while True:
            hid += 1
            # Stop once we've covered the known range and hit trailing empties.
            if upper and hid > upper and empty_streak == 0:
                # Probe a little past `count` in case it slightly undercounts.
                if hid > upper + STOP_AFTER_EMPTY:
                    break
            if limit and hid > limit:
                break

            if hid in done:
                skipped += 1
                empty_streak = 0
                _progress(slug, hid, upper, saved, skipped, failed, started,
                          note="skip (already saved)")
                continue

            url = f"{BASE_URL}/{slug}/{hid}"
            try:
                html = fetcher.get(url)
            except Exception as exc:  # noqa: BLE001 — log and move on
                failed += 1
                _progress(slug, hid, upper, saved, skipped, failed, started,
                          note="FETCH FAILED", newline=True)
                print(f"    ! {url}: {exc}", file=sys.stderr)
                empty_streak = 0
                continue

            rec = parse_hadees(html, url=url, book_slug=slug,
                               book_name=name, hid=hid)
            if rec is None:
                empty_streak += 1
                _progress(slug, hid, upper, saved, skipped, failed, started,
                          note=f"empty page ({empty_streak})")
                if empty_streak >= STOP_AFTER_EMPTY and (not upper or hid >= upper):
                    _progress(slug, hid, upper, saved, skipped, failed, started,
                              note="stopping (end of book)", newline=True)
                    break
                continue

            empty_streak = 0
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
            fh.flush()
            saved += 1
            status = (rec.get("status") or [{}])[0].get("english") or "?"
            _progress(slug, hid, upper, saved, skipped, failed, started,
                      note=f"saved #{rec.get('international_number')} [{status}]")

    _progress(slug, hid, upper, saved, skipped, failed, started, newline=True)
    print(f"  done {slug}: +{saved} new, {skipped} skipped, {failed} failed "
          f"(total on disk {len(done) + saved})", file=sys.stderr)
    return saved


def main():
    ap = argparse.ArgumentParser(description="Scrape hadees from al-hadees.com")
    ap.add_argument("books", nargs="*",
                    help="book slugs to scrape (default: all in books.json)")
    ap.add_argument("--delay", type=float, default=0.5,
                    help="seconds between requests (default 0.5)")
    ap.add_argument("--limit", type=int, default=None,
                    help="max ids per book (smoke testing)")
    ap.add_argument("--refresh-books", action="store_true",
                    help="rebuild books.json from the live site first")
    args = ap.parse_args()

    if args.refresh_books or not os.path.exists(
            os.path.join(HERE, "books.json")):
        build_books(delay=args.delay)

    all_books = load_books()
    if args.books:
        wanted = set(args.books)
        books = [b for b in all_books if b["slug"] in wanted]
        missing = wanted - {b["slug"] for b in books}
        if missing:
            print(f"Unknown slug(s): {', '.join(sorted(missing))}",
                  file=sys.stderr)
    else:
        books = all_books

    fetcher = Fetcher(delay=args.delay)
    grand = 0
    for book in books:
        grand += scrape_book(fetcher, book, limit=args.limit)
    print(f"\nAll done. {grand} new records this run.", file=sys.stderr)


if __name__ == "__main__":
    main()
