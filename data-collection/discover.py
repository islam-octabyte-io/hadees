"""
discover.py — Discover the list of hadees books and how many narrations each
has, straight from the live site, and write it to ``books.json``.

Run this once before scraping (and again whenever the site adds a new book):

    python discover.py

Output (books.json) is a list of:
    {"slug": "bukhari", "name": "Sahih Bukhari",
     "urdu_name": "صحیح بخاری", "count": 7563}

``count`` is the "N Narrations" figure shown on each book's landing page. The
single-hadees URL ids run contiguously from 1..count, which is what the scraper
iterates over.
"""

import json
import re
import os
import sys

from bs4 import BeautifulSoup

from fetcher import Fetcher, BASE_URL

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS_JSON = os.path.join(HERE, "books.json")


def discover_slugs(fetcher):
    """Return {slug: display_name} for every book linked from the homepage."""
    html = fetcher.get_url("/")
    soup = BeautifulSoup(html, "lxml")
    books = {}
    for a in soup.find_all("a", href=re.compile(r"/hadees-name/[^/]+/0")):
        m = re.search(r"/hadees-name/([^/]+)/0", a["href"])
        if not m:
            continue
        slug = m.group(1)
        name = re.sub(r"\s+", " ", a.get_text(" ", strip=True))
        if slug not in books and name:
            books[slug] = name
    return books


def book_meta(fetcher, slug):
    """Fetch a book's landing page and return (urdu_name, count)."""
    html = fetcher.get_url(f"/hadees-name/{slug}/0")
    soup = BeautifulSoup(html, "lxml")
    text = soup.get_text(" ", strip=True)

    # "7563 Narrations"
    count = None
    m = re.search(r"([0-9,]+)\s+Narrations", text)
    if m:
        count = int(m.group(1).replace(",", ""))

    # The Urdu book title appears in the header, e.g. "صحیح بخاری".
    urdu_name = None
    for el in soup.find_all(class_=re.compile("font-arabic")):
        t = re.sub(r"\s+", " ", el.get_text(" ", strip=True))
        if t and len(t) < 40:
            urdu_name = t
            break

    return urdu_name, count


def build(delay=0.5):
    fetcher = Fetcher(delay=delay)
    slugs = discover_slugs(fetcher)
    print(f"Found {len(slugs)} books on the homepage.", file=sys.stderr)

    books = []
    for slug, name in slugs.items():
        urdu_name, count = book_meta(fetcher, slug)
        print(f"  {slug:<26} {str(count):>7} narrations  ({name})",
              file=sys.stderr)
        books.append({
            "slug": slug,
            "name": name,
            "urdu_name": urdu_name,
            "count": count,
        })

    with open(BOOKS_JSON, "w", encoding="utf-8") as fh:
        json.dump(books, fh, ensure_ascii=False, indent=2)
    total = sum(b["count"] or 0 for b in books)
    print(f"\nWrote {BOOKS_JSON} — {len(books)} books, "
          f"{total:,} narrations total.", file=sys.stderr)
    return books


def load_books():
    """Load books.json (must have been built by build())."""
    with open(BOOKS_JSON, encoding="utf-8") as fh:
        return json.load(fh)


if __name__ == "__main__":
    build()
