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

    saved = 0
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
                empty_streak = 0
                continue

            url = f"{BASE_URL}/{slug}/{hid}"
            try:
                html = fetcher.get(url)
            except Exception as exc:  # noqa: BLE001 — log and move on
                print(f"  ! fetch failed {url}: {exc}", file=sys.stderr)
                empty_streak = 0
                continue

            rec = parse_hadees(html, url=url, book_slug=slug,
                               book_name=name, hid=hid)
            if rec is None:
                empty_streak += 1
                if empty_streak >= STOP_AFTER_EMPTY and (not upper or hid >= upper):
                    print(f"  stopping at id {hid} "
                          f"({empty_streak} consecutive empties)", file=sys.stderr)
                    break
                continue

            empty_streak = 0
            fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
            fh.flush()
            saved += 1
            if saved % 50 == 0:
                print(f"  {slug}: saved {saved} (at id {hid}/{count})",
                      file=sys.stderr)

    print(f"  done {slug}: +{saved} new records "
          f"(total {len(done) + saved})", file=sys.stderr)
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
