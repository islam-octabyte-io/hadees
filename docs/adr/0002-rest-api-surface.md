# REST API surface: Books → Kitabs → Baabs → Hadiths, addressed by composite identifier

The read API mirrors the sibling Quran project's shape so the two feel like one family of services, translated to this corpus: where the Quran has 114 flat surahs plus five cross-cutting division schemes (juz, hizb, rub, ruku, manzil), the hadith corpus has a single three-level hierarchy. **Books → Kitabs → Baabs** therefore absorb both roles — `/books` plays the surah part, and kitabs and baabs each get the divisions' "list / one / its-hadiths" trio. There is deliberately no `/juzs`-style endpoint and no second partitioning of the corpus; hadiths belong to exactly one baab.

## Considered options

**Identifier grammar: split on the last colon.** Every entity accepts a UCI (`HK3`), a number, and — for books — a slug. On top of that, a child can be addressed by its position inside its parent: `bukhari:3` is kitab 3 of Bukhari. The parse rule is *split on the last colon; the left side resolves as the parent, the right side is the number within it*. Because slugs and UCIs never contain a colon, this composes to any depth for free (`bukhari:3:5` = baab 5 of kitab 3 of Bukhari) instead of needing a bespoke pattern per level. Resolution lives in plain functions in `backend/src/common/resolve.ts`, not in the parent's service — that is what keeps the `Books → Kitabs → Baabs → Hadiths → Editions` module graph acyclic while each nested route still delegates to the child service instead of duplicating its query.

Hadith UCIs are the wrinkle: `HB100` and `HZ1` are the same shape. The parser rejects the second letters `Z`, `K`, `Y`, `E`, `X` (books, kitabs, baabs, editions, texts), which no book's `hadith_prefix` uses. See the UCI registry in `backend/src/db/schema/books.ts`.

**Default edition is `ar-vocalized`, matching Quran's `quran-simple`.** Omitting `?edition=` returns the Arabic original only, not both editions. Bilingual screens must ask for `?edition=ar-vocalized,ur-darussalam` explicitly. The alternative — defaulting to everything — makes payloads grow silently every time an edition is seeded.

**Paginated lists return `{ data, meta }`, single resources stay bare.** Unlike the Quran API, where a whole surah is at most 286 ayahs, Bukhari alone is 7,563 hadiths, so `.../hadiths` routes cannot return everything. `meta.total` comes from a `count()` over the filtered set so clients can size a pager without a second request. `/books` (15 rows) and the `.../kitabs` and `.../baabs` child listings stay unpaginated bare arrays — they are bounded and small.

**No `/search` yet.** `hadith_texts.text_plain` carries a pg_trgm GIN index built for exactly this, but search is out of scope for the first pass and lands separately rather than being half-designed alongside the browse routes.

## Consequences

- Adding an edition stays a data-only change: one `editions` row plus one `hadith_texts` row per hadith, and the API picks it up with no code change.
- Texts for a whole page load in one `inArray` query keyed on `(hadith_uci, edition_uci)`; a per-hadith fetch would be 100 round trips at `limit=100`. `text_plain` is never selected — it is the search-normalized form, not display text.
- A hadith's `texts` array can be empty. Roughly 40 hadiths have no row in one edition, so clients must not assume one entry per requested edition.
- `GET /` no longer returns anything; the Nest scaffold's Hello World controller was replaced by `GET /health`, which reports database connectivity and answers 503 (not a 200 saying "down") when the pool is unreachable.
- `setupSwagger` lives in `backend/src/swagger.ts` rather than inline in `main.ts` so the e2e suite can mount the same document and assert the route surface.
