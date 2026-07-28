import { cache } from "react";
import createClient from "openapi-fetch";

import type { components, paths } from "./schema";

/**
 * Typed client for the Hadees API. All reads run server-side (in Server
 * Components and Server Actions), so requests go server-to-server and the
 * backend's lack of CORS never comes into play.
 *
 * The corpus is immutable once seeded, so every read is cached for a week.
 * `baseOptions` are spread into each request by openapi-fetch, which is why
 * `revalidate` is set once here rather than repeated on all sixteen wrappers.
 */
export const api = createClient<paths>({
  baseUrl: process.env.API_URL ?? "http://localhost:3003",
  next: { revalidate: 60 * 60 * 24 * 7 },
});

/** Arabic original plus the Urdu translation — the corpus's only two editions. */
export const DEFAULT_EDITIONS = "ar-vocalized,ur-darussalam";

export type Book = components["schemas"]["BookDto"];
export type Kitab = components["schemas"]["KitabDto"];
export type Baab = components["schemas"]["BaabDto"];
export type Hadith = components["schemas"]["HadithDto"];
export type HadithText = Hadith["texts"][number];
export type Edition = components["schemas"]["EditionDto"];
export type PageMeta = components["schemas"]["PaginatedHadiths"]["meta"];
export type Paginated<T> = { data: T[]; meta: PageMeta };

/** Page/limit/edition, shared by every paginated hadith route. */
export type ListQuery = { page?: number; limit?: number; edition?: string };

/** Thrown when the API responds with a non-2xx status. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    resource: string,
  ) {
    super(`Hadees API request for ${resource} failed (${status}).`);
    this.name = "ApiError";
  }
}

function unwrap<T>(
  resource: string,
  result: { data?: T; error?: unknown; response: Response },
): T {
  if (result.error !== undefined || result.data === undefined) {
    throw new ApiError(result.response.status, resource);
  }
  return result.data;
}

/**
 * Resolve a read, returning null when the API says the thing does not exist or
 * the identifier is malformed. Server errors still throw, so a broken backend
 * surfaces as an error page rather than a misleading "not found".
 */
export async function orNull<T>(read: Promise<T>): Promise<T | null> {
  try {
    return await read;
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 404 || error.status === 400)
    ) {
      return null;
    }
    throw error;
  }
}

// ── Books ────────────────────────────────────────────────────────────────────

/** All 15 collections, in canonical order (the six sahih first). */
export const getBooks = cache(async function getBooks(): Promise<Book[]> {
  return unwrap("books", await api.GET("/books"));
});

export async function getBook(identifier: string): Promise<Book> {
  return unwrap(
    `book ${identifier}`,
    await api.GET("/books/{identifier}", {
      params: { path: { identifier } },
    }),
  );
}

export async function getBookKitabs(identifier: string): Promise<Kitab[]> {
  return unwrap(
    `kitabs of book ${identifier}`,
    await api.GET("/books/{identifier}/kitabs", {
      params: { path: { identifier } },
    }),
  );
}

export async function getBookHadiths(
  identifier: string,
  query: ListQuery = {},
): Promise<Paginated<Hadith>> {
  return unwrap(
    `hadiths of book ${identifier}`,
    await api.GET("/books/{identifier}/hadiths", {
      params: { path: { identifier }, query },
    }),
  );
}

/**
 * Books keyed three ways. `HadithDto` carries only a `bookPrefix`, so anything
 * that renders a hadith outside its own book page needs this to name it.
 */
export const getBookIndex = cache(async function getBookIndex() {
  const books = await getBooks();
  return {
    all: books,
    bySlug: new Map(books.map((b) => [b.slug, b])),
    byPrefix: new Map(books.map((b) => [b.hadithPrefix, b])),
    byUci: new Map(books.map((b) => [b.uci, b])),
  };
});

/** Total narrations in the corpus, from a single count query. */
export const getCorpusTotal = cache(
  async function getCorpusTotal(): Promise<number> {
    const { meta } = await getHadiths({ limit: 1 });
    return meta.total;
  },
);

/**
 * Narrations per collection, keyed by slug. Fifteen count queries, so this is
 * for the index only — everywhere else `getCorpusTotal` is one request.
 */
export const getBookNarrationCounts = cache(
  async function getBookNarrationCounts(): Promise<Map<string, number>> {
    const books = await getBooks();
    const counts = await Promise.all(
      books.map(async (book) => {
        const { meta } = await getBookHadiths(book.slug, { limit: 1 });
        return [book.slug, meta.total] as const;
      }),
    );
    return new Map(counts);
  },
);

// ── Kitabs ───────────────────────────────────────────────────────────────────

export async function getKitabs(
  query: { page?: number; limit?: number; book?: string } = {},
): Promise<Paginated<Kitab>> {
  return unwrap("kitabs", await api.GET("/kitabs", { params: { query } }));
}

export async function getKitab(identifier: string): Promise<Kitab> {
  return unwrap(
    `kitab ${identifier}`,
    await api.GET("/kitabs/{identifier}", {
      params: { path: { identifier } },
    }),
  );
}

export async function getKitabBaabs(identifier: string): Promise<Baab[]> {
  return unwrap(
    `baabs of kitab ${identifier}`,
    await api.GET("/kitabs/{identifier}/baabs", {
      params: { path: { identifier } },
    }),
  );
}

export async function getKitabHadiths(
  identifier: string,
  query: ListQuery = {},
): Promise<Paginated<Hadith>> {
  return unwrap(
    `hadiths of kitab ${identifier}`,
    await api.GET("/kitabs/{identifier}/hadiths", {
      params: { path: { identifier }, query },
    }),
  );
}

// ── Baabs ────────────────────────────────────────────────────────────────────

export async function getBaabs(
  query: { page?: number; limit?: number; book?: string; kitab?: string } = {},
): Promise<Paginated<Baab>> {
  return unwrap("baabs", await api.GET("/baabs", { params: { query } }));
}

export async function getBaab(identifier: string): Promise<Baab> {
  return unwrap(
    `baab ${identifier}`,
    await api.GET("/baabs/{identifier}", {
      params: { path: { identifier } },
    }),
  );
}

export async function getBaabHadiths(
  identifier: string,
  query: ListQuery = {},
): Promise<Paginated<Hadith>> {
  return unwrap(
    `hadiths of baab ${identifier}`,
    await api.GET("/baabs/{identifier}/hadiths", {
      params: { path: { identifier }, query },
    }),
  );
}

// ── Hadiths ──────────────────────────────────────────────────────────────────

export async function getHadiths(
  query: ListQuery & { book?: string; kitab?: string; baab?: string } = {},
): Promise<Paginated<Hadith>> {
  return unwrap("hadiths", await api.GET("/hadiths", { params: { query } }));
}

export async function getHadith(
  identifier: string,
  edition: string = DEFAULT_EDITIONS,
): Promise<Hadith> {
  return unwrap(
    `hadith ${identifier}`,
    await api.GET("/hadiths/{identifier}", {
      params: { path: { identifier }, query: { edition } },
    }),
  );
}

// ── Editions ─────────────────────────────────────────────────────────────────

export const getEditions = cache(async function getEditions(): Promise<
  Edition[]
> {
  return unwrap("editions", await api.GET("/editions"));
});

export async function getEdition(identifier: string): Promise<Edition> {
  return unwrap(
    `edition ${identifier}`,
    await api.GET("/editions/{identifier}", {
      params: { path: { identifier } },
    }),
  );
}

// ── Health ───────────────────────────────────────────────────────────────────

export async function getHealth() {
  return unwrap("health", await api.GET("/health"));
}

/**
 * Pull one edition's text out of a hadith. Roughly 40 hadiths are missing a
 * row in one edition, so `texts` can be short or empty — always match on the
 * slug rather than indexing into the array.
 */
export function textFor(hadith: Hadith, slug: string): HadithText | undefined {
  return hadith.texts.find((t) => t.edition === slug);
}
