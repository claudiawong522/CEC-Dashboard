import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { publicFileUrl } from "@/lib/utils/storage";

export default async function PastEventsPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, event_date, event_time, event_end_time, venue, has_speaker")
    .eq("is_complete", true)
    .order("event_date", { ascending: false })
    .order("event_time", { ascending: false });

  if (error) console.error("[past-events] failed to load events:", error.message);

  // This route is always dynamically rendered (createClient() reads
  // cookies()), so reading the current time per-request is safe — the
  // purity rule is guarding against future static/cached rendering.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const past = (events ?? []).filter(
    (e) => new Date(`${e.event_date}T${e.event_end_time ?? e.event_time}`).getTime() < now,
  );

  const speakerEventIds = past.filter((e) => e.has_speaker).map((e) => e.id);
  const portraitByEvent = new Map<string, string>();

  if (speakerEventIds.length > 0) {
    const { data: speakers } = await supabase
      .from("event_speaker")
      .select("event_id, portrait_file_id")
      .in("event_id", speakerEventIds)
      .not("portrait_file_id", "is", null);

    const fileIds = (speakers ?? []).map((s) => s.portrait_file_id).filter(Boolean) as string[];

    if (fileIds.length > 0) {
      const { data: files } = await supabase
        .from("event_files")
        .select("id, bucket, storage_path")
        .in("id", fileIds);

      const fileById = new Map((files ?? []).map((f) => [f.id, f]));
      for (const s of speakers ?? []) {
        const file = s.portrait_file_id ? fileById.get(s.portrait_file_id) : undefined;
        if (file) portraitByEvent.set(s.event_id, publicFileUrl(file.bucket, file.storage_path));
      }
    }
  }

  return (
    <div className="flex flex-col gap-[17px]">
      <h1 className="font-sans text-2xl leading-[1.2] font-medium tracking-[-0.022em] text-ink">
        Past Events
      </h1>

      {past.length === 0 ? (
        <p className="font-sans text-sm text-faint">No completed past events yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {past.map((event, i) => (
            <div
              key={event.id}
              style={{ animationDelay: `${0.05 + i * 0.07}s` }}
              className="flex items-center gap-[13px] rounded-[10px] border border-[rgba(35,32,28,0.09)] bg-paper p-3.5 transition-[transform,border-color] duration-200 ease-brand animate-riseIn hover:-translate-y-0.5 hover:border-[rgba(35,32,28,0.2)]"
            >
              {portraitByEvent.has(event.id) ? (
                <div className="relative size-12 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={portraitByEvent.get(event.id)!}
                    alt={event.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="size-12 shrink-0 rounded-full bg-[#F0EDE4]" />
              )}
              <div className="flex flex-col gap-[3px] overflow-hidden">
                <span className="truncate font-sans text-[13.5px] font-medium text-ink">
                  {event.name}
                </span>
                <span className="truncate font-sans text-[11.5px] text-body">
                  {event.event_date} · {event.event_time.slice(0, 5)}
                  {event.event_end_time ? `–${event.event_end_time.slice(0, 5)}` : ""}
                </span>
                <span className="truncate font-sans text-[11px] text-faint">{event.venue}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
