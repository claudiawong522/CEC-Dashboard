import { createClient } from "@/lib/supabase/server";
import { publicFileUrl } from "@/lib/utils/storage";
import { wallClockAt, wallClockNow } from "@/lib/utils/signin-window";
import { PastEventsGrid } from "@/components/past-events/PastEventsGrid";

export default async function PastEventsPage() {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, name, event_date, event_end_date, event_time, event_end_time, venue, has_speaker, has_media",
    )
    .eq("is_complete", true)
    .order("event_date", { ascending: false })
    .order("event_time", { ascending: false });

  if (error) console.error("[past-events] failed to load events:", error.message);

  // This route is always dynamically rendered (createClient() reads
  // cookies()), so reading the current time per-request is safe.
  //
  // Both sides of this comparison are Ithaca wall-clock minutes. It used to be
  // `new Date(\`${event_date}T${event_end_time}\`)`, which has no zone and so
  // meant UTC on Vercel: a 19:30-23:00 night was filed as past from 18:01
  // Ithaca, ninety minutes before its doors opened, and nobody noticed because
  // on a laptop in New York it was exactly right.
  //
  // An event also ends on `event_end_date`, not `event_date`. Using the start
  // date dropped a multi-day event into Past Events on its first day.
  const nowInIthaca = wallClockNow();
  const past = (events ?? []).filter(
    (e) =>
      wallClockAt(e.event_end_date ?? e.event_date, e.event_end_time ?? e.event_time) < nowInIthaca,
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

  const mediaEventIds = past.filter((e) => e.has_media).map((e) => e.id);
  const photoByEvent = new Map<string, string>();

  if (mediaEventIds.length > 0) {
    const { data: mediaFiles } = await supabase
      .from("event_files")
      .select("event_id, bucket, storage_path, mime_type, created_at")
      .in("event_id", mediaEventIds)
      .eq("section", "media")
      .like("mime_type", "image/%")
      .order("created_at", { ascending: true });

    // First image uploaded per event becomes its cover — mediaFiles is
    // ordered oldest-first, so the first time we see an event_id wins and
    // later duplicates are skipped.
    for (const file of mediaFiles ?? []) {
      if (!photoByEvent.has(file.event_id)) {
        photoByEvent.set(file.event_id, publicFileUrl(file.bucket, file.storage_path));
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
    // An actual event photo is more representative than the speaker
    // headshot, so it wins when both exist.
    iconUrl: photoByEvent.get(event.id) ?? portraitByEvent.get(event.id) ?? null,
  }));

  return <PastEventsGrid events={gridEvents} />;
}
