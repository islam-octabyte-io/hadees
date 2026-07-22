"""
export_csv.py — Flatten the scraped JSONL into a single CSV.

The JSONL keeps the full nested structure (all Urdu translations, all status
grades). For spreadsheet / quick-analysis use this writes one flat row per
hadees with the key fields:

    book_slug, book_name, id, international_number, arabic_number,
    kitab_urdu, bab_urdu, arabic,
    urdu_translator, urdu_text,          (the first/primary Urdu translation)
    english, status, status_urdu

Usage:
    python export_csv.py                 # all books -> data/hadees.csv
    python export_csv.py bukhari muslim   # only these books
    python export_csv.py -o out.csv       # custom output path
"""

import argparse
import csv
import glob
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")

COLUMNS = [
    "book_slug", "book_name", "id",
    "international_number", "arabic_number",
    "kitab_urdu", "bab_urdu",
    "arabic",
    "urdu_translator", "urdu_text",
    "english",
    "status", "status_urdu",
]


def flatten(rec):
    first = rec.get("urdu_first") or {}
    status = (rec.get("status") or [{}])[0]
    return {
        "book_slug": rec.get("book_slug"),
        "book_name": rec.get("book_name"),
        "id": rec.get("id"),
        "international_number": rec.get("international_number"),
        "arabic_number": rec.get("arabic_number"),
        "kitab_urdu": rec.get("kitab_urdu"),
        "bab_urdu": rec.get("bab_urdu"),
        "arabic": rec.get("arabic"),
        "urdu_translator": first.get("translator"),
        "urdu_text": first.get("text"),
        "english": rec.get("english"),
        "status": status.get("english"),
        "status_urdu": status.get("urdu"),
    }


def main():
    ap = argparse.ArgumentParser(description="Export scraped JSONL to CSV")
    ap.add_argument("books", nargs="*", help="book slugs (default: all)")
    ap.add_argument("-o", "--output", default=os.path.join(DATA_DIR, "hadees.csv"))
    args = ap.parse_args()

    if args.books:
        files = [os.path.join(DATA_DIR, f"{s}.jsonl") for s in args.books]
    else:
        files = sorted(glob.glob(os.path.join(DATA_DIR, "*.jsonl")))

    rows = 0
    with open(args.output, "w", encoding="utf-8-sig", newline="") as out:
        writer = csv.DictWriter(out, fieldnames=COLUMNS)
        writer.writeheader()
        for path in files:
            if not os.path.exists(path):
                print(f"  skip missing {path}", file=sys.stderr)
                continue
            with open(path, encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line:
                        continue
                    writer.writerow(flatten(json.loads(line)))
                    rows += 1
    print(f"Wrote {args.output} — {rows} rows.", file=sys.stderr)


if __name__ == "__main__":
    main()
