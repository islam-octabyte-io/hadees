"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Collections", match: (p: string) => p === "/" },
  {
    href: "/hadiths",
    label: "Read through",
    match: (p: string) => p.startsWith("/hadiths"),
  },
];

/** Two ways in: pick a collection, or read the corpus straight through. */
export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("items-center gap-4", className)}>
      {LINKS.map((link) => {
        const isActive = link.match(pathname);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "font-mono text-[0.6875rem] tracking-[0.16em] uppercase transition-colors",
              isActive
                ? "text-rubric underline decoration-rubric/40 underline-offset-[6px]"
                : "text-ink-3 hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
