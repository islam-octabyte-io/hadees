import { Jadwal } from "@/components/jadwal";
import { Skeleton } from "@/components/ui/skeleton";

/** Header placeholder shared by every reader and index page. */
function HeaderSkeleton() {
  return (
    <div className="border-b border-jadwal pb-8">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-4 h-9 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/3" />
    </div>
  );
}

/** Placeholder for a run of narrations, framed like the real page blocks. */
export function ReaderSkeleton({ entries = 3 }: { entries?: number }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Skeleton className="h-3 w-52" />
      <div className="mt-6">
        <HeaderSkeleton />
      </div>
      <div className="mt-12 space-y-12 sm:space-y-16">
        {Array.from({ length: entries }, (_, index) => (
          <div key={index} className="sm:pl-14">
            <Jadwal className="px-5 py-6 sm:px-9 sm:py-8">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="mt-3 h-6 w-11/12" />
              <Skeleton className="mt-3 h-6 w-4/5" />
              <div className="mt-7 border-t border-jadwal pt-7">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="mt-3 h-5 w-10/12" />
              </div>
            </Jadwal>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Placeholder for a fihrist. */
export function IndexSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Skeleton className="h-3 w-44" />
      <div className="mt-6">
        <HeaderSkeleton />
      </div>
      <div className="mt-10 border-t border-jadwal">
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className="flex items-start gap-6 border-b border-jadwal px-1 py-5 sm:px-3"
          >
            <Skeleton className="mt-1 h-4 w-8 shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-7 w-3/5" />
              <Skeleton className="mt-2 h-4 w-2/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
