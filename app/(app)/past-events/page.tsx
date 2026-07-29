import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { publicFileUrl } from "@/lib/utils/storage";

export default async function PastEventsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, name, event_date, event_time, venue, has_speaker")
    .eq("is_complete", true)
    .order("event_date", { ascending: false })
    .order("event_time", { ascending: false });

  // This route is always dynamically rendered (createClient() reads
  // cookies()), so reading the current time per-request is safe — the
  // purity rule is guarding against future static/cached rendering.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const past = (events ?? []).filter(
    (e) => new Date(`${e.event_date}T${e.event_time}`).getTime() < now,
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
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-medium tracking-tight">Past Events</h1>

      {past.length === 0 ? (
        <p className="text-sm text-muted-foreground">No completed past events yet.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {past.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-3 rounded-lg border border-stone-200 p-3"
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
                <div className="size-12 shrink-0 rounded-full bg-stone-100" />
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">{event.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {event.event_date} · {event.venue}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
