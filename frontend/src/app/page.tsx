import { BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-lg border bg-card p-6 text-card-foreground">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Hadees
          </h1>
          <p className="text-sm text-muted-foreground">
            Frontend scaffold smoke test — Next.js, Tailwind CSS and shadcn/ui.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button>
            <BookOpen data-icon="inline-start" />
            Browse hadiths
          </Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>
    </main>
  );
}
