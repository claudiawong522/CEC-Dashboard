import { createClient } from "@/lib/supabase/server";
import { publicFileUrl } from "@/lib/utils/storage";
import { PastEventsGrid } from "@/components/past-events/PastEventsGrid";

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

  const gridEvents = past.map((event) => ({
    id: event.id,
    name: event.name,
    event_date: event.event_date,
    event_time: event.event_time,
    event_end_time: event.event_end_time,
    venue: event.venue,
    portraitUrl: portraitByEvent.get(event.id) ?? null,
  }));

  return <PastEventsGrid events={gridEvents} />;
}
