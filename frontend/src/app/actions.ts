"use server";

import { redirect } from "next/navigation";

import {
  getBaab,
  getBook,
  getBookIndex,
  getHadith,
  getKitab,
  orNull,
} from "@/lib/api/client";
import { baabHref, bookHref, hadithHref, kitabHref } from "@/lib/hadees";

/**
 * Resolve a citation the reader typed and go there. The API already accepts
 * every form scholars use — "HB100", "bukhari:100", "bukhari:3:5" — so this
 * only has to work out which level was meant and hand the string over.
 *
 * A form action rather than client-side fetching, so lookup works with
 * JavaScript disabled.
 */
export async function lookup(formData: FormData) {
  const query = String(formData.get("q") ?? "").trim();
  if (!query) redirect("/");

  const target = await resolve(query);
  redirect(target ?? `/?lookup=${encodeURIComponent(query)}`);
}

async function resolve(raw: string): Promise<string | null> {
  const query = raw.replace(/\s+/g, "");
  const colons = (query.match(/:/g) ?? []).length;

  // "bukhari:3:5" can only be a baab.
  if (colons >= 2) return baabTarget(query);

  // "bukhari:100" is how a hadith is cited, so that reading wins. A kitab is
  // still reachable by its own UCI.
  if (colons === 1) {
    const hadith = await orNull(getHadith(query));
    if (hadith) return hadithHref(hadith.uci);
    return kitabTarget(query);
  }

  const uci = /^H([A-Za-z])\d+[A-Za-z]?$/.exec(query);
  if (uci) {
    switch (uci[1].toUpperCase()) {
      case "Z":
        return bookTarget(query);
      case "K":
        return kitabTarget(query);
      case "Y":
        return baabTarget(query);
      // Editions and text rows have no page of their own.
      case "E":
      case "X":
        return null;
      default:
        return hadithTarget(query);
    }
  }

  // A bare slug or number is a collection.
  return bookTarget(query);
}

async function hadithTarget(identifier: string): Promise<string | null> {
  const hadith = await orNull(getHadith(identifier));
  return hadith ? hadithHref(hadith.uci) : null;
}

async function bookTarget(identifier: string): Promise<string | null> {
  const book = await orNull(getBook(identifier));
  return book ? bookHref(book.slug) : null;
}

async function kitabTarget(identifier: string): Promise<string | null> {
  const kitab = await orNull(getKitab(identifier));
  if (!kitab) return null;

  const { byUci } = await getBookIndex();
  const book = byUci.get(kitab.bookUci);
  return book ? kitabHref(book.slug, kitab.numberInBook) : null;
}

async function baabTarget(identifier: string): Promise<string | null> {
  const baab = await orNull(getBaab(identifier));
  if (!baab) return null;

  const kitab = await orNull(getKitab(baab.kitabUci));
  if (!kitab) return null;

  const { byUci } = await getBookIndex();
  const book = byUci.get(kitab.bookUci);
  return book
    ? baabHref(book.slug, kitab.numberInBook, baab.numberInKitab)
    : null;
}
