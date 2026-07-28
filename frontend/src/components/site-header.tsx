import Link from "next/link";

import { LookupBar } from "@/components/lookup-bar";
import { MainNav } from "@/components/main-nav";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * The wordmark, the two ways into the corpus, and the lookup bar. The edition
 * picker deliberately lives on the reader pages instead — it only means
 * anything where there is text to show.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-jadwal bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-baseline gap-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <span className="font-mono text-sm font-medium tracking-[0.22em] text-foreground uppercase">
            Hadees
          </span>
          <span
            aria-hidden="true"
            className="script-arabic text-base text-rubric"
            lang="ar"
          >
            الحديث
          </span>
        </Link>

        <MainNav className="hidden sm:flex" />

        <div className="ml-auto flex items-center gap-2">
          <LookupBar variant="compact" className="hidden md:flex" />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
