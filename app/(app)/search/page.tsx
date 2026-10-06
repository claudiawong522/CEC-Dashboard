import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatEventDate, formatEventTime } from "@/lib/utils/format-event-time";
import { SearchDecor } from "@/components/search/SearchDecor";

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
  // syntax — strip them out of the raw search term so it can't be used to
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
    <div className="relative flex flex-col gap-[17px]">
      <SearchDecor />
      <div className="relative z-10 flex flex-col gap-[5px]">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Search
        </h1>
        <p className="font-sans text-[12.5px] text-faint">
          {query ? (
            <>
              {results?.length ?? 0} result{results?.length === 1 ? "" : "s"} for &ldquo;{query}
              &rdquo;
            </>
          ) : (
            "Search by event name or venue."
          )}
        </p>
      </div>

      {query && (!results || results.length === 0) ? (
        <p className="relative z-10 font-sans text-[14px] text-faint">
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="relative z-10 flex flex-col gap-2">
          {(results ?? []).map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="flex items-center justify-between gap-3 rounded-[10px] border border-[rgba(0,0,0,0.09)] bg-paper px-4 py-3 transition-[transform,border-color] duration-200 ease-brand hover:-translate-y-0.5 hover:border-[rgba(0,0,0,0.2)]"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-sans text-[13.5px] font-medium text-ink">
                  {event.name}
                </span>
                <span className="truncate font-sans text-[11.5px] text-faint">{event.venue}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <span className="font-mono text-[10.5px] tracking-[0.08em] text-body uppercase">
                  {formatEventDate(event.event_date)} · {formatEventTime(event.event_time)}
                </span>
                {event.is_complete && (
                  <span className="rounded-[20px] bg-teal/12 px-2 py-0.5 font-mono text-[9px] tracking-[0.1em] text-teal uppercase">
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
