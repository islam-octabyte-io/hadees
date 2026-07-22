# Hadees data collection

Python scrapers that collect the full hadees corpus from
[al-hadees.com](https://al-hadees.com/) and save it in a reusable format.

The site publishes **24 hadees books** (≈ **185,000 narrations** total). All
pages are plain server-rendered HTML, so scraping needs only `requests` +
`BeautifulSoup` — no browser/JS.

## Site structure

The site nests four page types (example: Sahih Bukhari, slug `bukhari`):

| Level | URL pattern | Contents |
|-------|-------------|----------|
| Books list | `/hadees-name/<slug>/<page>` | the books / kitabs of one collection |
| Chapters | `/hadees-subjects/<slug>/<book>/<page>` | chapters of a book |
| Hadees list | `/hadees/<slug>/<chapter>/<page>` | hadees with "Read Complete Hadees" links |
| **Single hadees** | `/<slug>/<id>` | the actual hadees text + metadata |

**Key fact that keeps the scraper simple:** every hadees has a stable,
sequential URL `/<slug>/<id>` where `id` runs `1..count`, and `count` is the
"N Narrations" number shown on the book's landing page. Each single-hadees page
also carries its own book (kitab) and chapter (bab) headers. So we can skip the
intermediate listing pages entirely and just walk the ids per book — which is
both complete and far simpler than crawling the hierarchy.

## What is captured per hadees

Required fields (from the task) plus useful extras:

- `arabic` — the Arabic matn (clean, from the page's hidden copy `<textarea>`)
- `urdu` — **all** Urdu translations as `{translator, text}`; `urdu_first` is the
  first one (translator name + text)
- `english` — English translation (when present)
- `international_number` and `arabic_number` (ترقیم — the traditional catalog
  number, which can differ from the URL id)
- `status` — the hukm / grade, e.g. `{"english": "Sahih", "urdu": "صحیح"}`
  (a list, since a few books carry more than one grade)
- `status_reference` — the note explaining the grade
- `kitab_arabic/urdu/english` and `bab_arabic/urdu/english` — book & chapter
  context (best-effort; a few book templates omit or restyle these)
- `book_slug`, `book_name`, `url`, `id`

## Files

| File | Purpose |
|------|---------|
| `fetcher.py` | Polite HTTP client (retries, backoff, delay) |
| `parser.py` | Parse one single-hadees HTML page → structured dict |
| `discover.py` | Build `books.json` (slugs, names, narration counts) from the live site |
| `scrape.py` | Main scraper — walks ids per book, resumable, writes `data/<slug>.jsonl` |
| `export_csv.py` | Flatten the JSONL into `data/hadees.csv` |
| `books.json` | Generated book registry (24 books + counts) |
| `data/` | Output: one `<slug>.jsonl` per book (+ `hadees.csv`) |

## Running data collection

A full run from scratch, step by step. Run everything from inside the
`data-collection/` directory; the examples use the project venv at `../.venv`.

**1. Set up the environment (once)**

```bash
cd data-collection
python3 -m venv ../.venv
../.venv/bin/pip install -r requirements.txt
```

**2. Build the book registry**

`books.json` is committed, but rebuild it to pick up any newly-added books and
refresh the narration counts:

```bash
../.venv/bin/python discover.py
```

**3. Smoke-test before the real run**

Grab a handful of hadees to confirm everything works end to end:

```bash
../.venv/bin/python scrape.py bukhari --limit 5
```

Check `data/bukhari.jsonl` — you should see 5 JSON lines with Arabic, Urdu,
number and status.

**4. Collect the data**

```bash
# One or more specific books
../.venv/bin/python scrape.py bukhari muslim

# Every book (~185k narrations — long-running, see below)
../.venv/bin/python scrape.py
```

Because the full corpus is large, run it in the background and log the output so
you can watch progress and let it survive a closed terminal:

```bash
nohup ../.venv/bin/python scrape.py --delay 0.5 > scrape.log 2>&1 &

tail -f scrape.log        # watch live progress
```

The scrape is **resumable** — it appends to `data/<slug>.jsonl` and skips ids
already saved, so you can stop it (`Ctrl-C` / `kill`) and re-run the same
command any time to continue where it left off. Nothing is re-fetched.

**5. Check what you have collected**

```bash
# records per book
wc -l data/*.jsonl

# total records collected so far
cat data/*.jsonl | wc -l
```

**6. Export to CSV (optional)**

```bash
../.venv/bin/python export_csv.py            # -> data/hadees.csv (all books)
../.venv/bin/python export_csv.py bukhari    # a single book
```

### Useful options

| Option | Effect |
|--------|--------|
| `<slug> [<slug> …]` | scrape only these books (default: all in `books.json`) |
| `--limit N` | stop each book after N ids (smoke testing) |
| `--delay S` | seconds between requests (default `0.5`; raise to be gentler) |
| `--refresh-books` | rebuild `books.json` from the site before scraping |

Book slugs are the keys in `books.json` (e.g. `bukhari`, `muslim`, `tirmazi`,
`abu-dawood`, `nisai`, `ibn-e-maja`, `musnad-ahmed`, …).

## Output format

`data/<slug>.jsonl` — one JSON object per line (UTF-8). This format is:

- **append-friendly / resumable** — re-running `scrape.py` reads the ids already
  saved and skips them, so it is safe to stop and restart at any time;
- **streamable** — you can process it line-by-line without loading everything.

Example (abridged):

```json
{
  "book_slug": "bukhari", "book_name": "Sahih Bukhari",
  "id": 3, "international_number": "3", "arabic_number": "3",
  "arabic": "حَدَّثَنَا يَحْيَى بْنُ بُكَيْرٍ …",
  "urdu_first": {"translator": "مولانا محمد داؤد راز", "text": "ہم کو یحییٰ …"},
  "english": "Narrated 'Aisha: …",
  "status": [{"english": "Sahih", "urdu": "صحیح"}],
  "kitab_urdu": "کتاب: وحی کے بیان میں", "bab_urdu": "( وحی کی ابتداء )"
}
```

## Progress output

`scrape.py` reports live progress per book:

```
=== Sahih Bukhari (bukhari) — 7563 narrations, 0 already saved ===
  bukhari    1234/7563  16.3%  saved 1200  skip 34  fail 0  1.9/s  saved #1234 [Sahih]
```

On an interactive terminal this is a single line that updates in place; when
output is redirected to a log file (e.g. a background run) it prints the first
item and then every 25. Each book ends with a `done … +N new, N skipped,
N failed` summary.

## Notes on running the full scrape

- The full corpus is ~185k narrations. At the default 0.5s delay that is a
  many-hour job; run it in the background (e.g. `nohup`/`tmux`) and let the
  resume logic handle interruptions.
- Be considerate: keep a delay, and avoid running many parallel workers against
  this single small site.
- `scrape.py` stops a book after `STOP_AFTER_EMPTY` consecutive out-of-range
  (empty) pages past the known count, so slight count mismatches are handled.
