import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatEventTime } from "@/lib/utils/format-event-time";
import { PageHeader } from "@/components/ui/page-header";
import { TriangleScatter } from "@/components/decor/shapes";

type SearchResult = {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  venue: string;
  is_complete: boolean;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();

  // `,` and `()` are structural characters in PostgREST's .or() filter
  // syntax, so strip them out of the raw search term so it can't be used to
  // inject extra filter clauses.
  const safeQuery = query.replace(/[,()]/g, " ");

  const { data: results } = query
    ? await supabase
        .from("events")
        .select("id, name, event_date, event_time, venue, is_complete")
        .or(`name.ilike.%${safeQuery}%,venue.ilike.%${safeQuery}%`)
        .order("event_date", { ascending: false })
        .limit(50)
        .returns<SearchResult[]>()
    : { data: [] as SearchResult[] };

  return (
    <div className="relative flex flex-col gap-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-40">
        <TriangleScatter count={4} seed={37} opacity={0.2} />
      </div>
      <div className="relative z-10">
        <PageHeader title="Search">
          {query ? (
            <>
              {results?.length ?? 0} result{results?.length === 1 ? "" : "s"} for &ldquo;{query}
              &rdquo;
            </>
          ) : (
            "Search by event name or venue."
          )}
        </PageHeader>
      </div>

      {query && (!results || results.length === 0) ? (
        <p className="relative z-10 font-sans text-[14px] text-foreground/50">
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="relative z-10 flex flex-col gap-2">
          {(results ?? []).map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="flex flex-col items-start gap-1.5 border border-line bg-background px-4 py-3 shadow-soft transition-[box-shadow,transform,border-color] duration-300 ease-fluid hover:-translate-y-0.5 hover:border-foreground hover:shadow-mint-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
            >
              <div className="flex w-full min-w-0 flex-col gap-0.5 sm:w-auto">
                <span className="truncate font-sans text-[14px] font-medium text-foreground">
                  {event.name}
                </span>
                <span className="truncate font-sans text-[12px] text-foreground/50">{event.venue}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <span className="t-eyebrow text-subtle">
                  {formatEventDate(event.event_date)} · {formatEventTime(event.event_time)}
                </span>
                {event.is_complete && (
                  <span className="t-eyebrow border border-foreground bg-mint px-2 py-0.5 text-foreground">
                    Done
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
