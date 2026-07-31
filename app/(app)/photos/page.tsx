import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { publicFileUrl } from "@/lib/utils/storage";
import { Sticker } from "@/components/stickers/Sticker";
import { PhotosDecor } from "@/components/photos/PhotosDecor";
import { AddPhotoDialog } from "@/components/photos/AddPhotoDialog";

type MediaFile = {
  id: string;
  event_id: string;
  bucket: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  events: { name: string; event_date: string } | null;
};

function fileTypeLabel(file: MediaFile) {
  const ext = file.file_name?.split(".").pop();
  if (ext) return ext.toLowerCase();
  if (file.mime_type?.startsWith("video/")) return "video";
  return "file";
}

export default async function PhotosPage() {
  const supabase = await createClient();

  const [{ data: files }, { data: allEvents }] = await Promise.all([
    supabase
      .from("event_files")
      .select("id, event_id, bucket, storage_path, file_name, mime_type, events(name, event_date)")
      .eq("section", "media")
      .order("created_at", { ascending: false })
      .returns<MediaFile[]>(),
    supabase
      .from("events")
      .select("id, name, event_date, event_time, event_end_time")
      .order("event_date", { ascending: false })
      .order("event_time", { ascending: false })
      .returns<{ id: string; name: string; event_date: string; event_time: string; event_end_time: string | null }[]>(),
  ]);

  // Photos get added after an event happens — the picker should surface
  // events that have already happened (latest first), not bury them under
  // every future recurring occurrence.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const events = (allEvents ?? []).filter(
    (e) => new Date(`${e.event_date}T${e.event_end_time ?? e.event_time}`).getTime() < now,
  );

  return (
    <div className="relative flex flex-col gap-[17px]">
      <PhotosDecor />
      <div className="relative z-10 flex items-center justify-between">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Photos
        </h1>
        <AddPhotoDialog
          events={events}
          className="rounded-input border border-line-input bg-paper px-[13px] py-[7px] font-sans text-[12.5px] text-body transition-colors duration-200 hover:bg-wash hover:text-ink"
        >
          + Add photo
        </AddPhotoDialog>
      </div>

      {!files || files.length === 0 ? (
        <AddPhotoDialog
          events={events}
          className="group relative flex aspect-square max-w-[220px] flex-col items-center justify-center gap-[7px] overflow-hidden rounded-[9px] border border-dashed border-[rgba(35,32,28,0.14)] text-center transition-colors duration-200 hover:border-[rgba(35,32,28,0.28)] hover:bg-wash"
        >
          <Sticker floatVariant="none" className="relative block h-[34px] w-11">
            <div
              className="absolute top-[5px] left-0 size-[22px] rounded-full blur-[6px]"
              style={{ background: "radial-gradient(circle, rgba(232,88,61,.8), transparent 72%)" }}
            />
            <div
              className="absolute top-0 left-[13px] size-5 rounded-full blur-[6px]"
              style={{ background: "radial-gradient(circle, rgba(224,185,74,.8), transparent 72%)" }}
            />
            <div
              className="absolute top-[11px] left-6 size-5 rounded-full blur-[6px]"
              style={{ background: "radial-gradient(circle, rgba(63,167,137,.7), transparent 72%)" }}
            />
          </Sticker>
          <span className="px-4 font-sans text-[10px] text-faint">
            No media uploaded yet — click to add a photo
          </span>
        </AddPhotoDialog>
      ) : (
        <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {files.map((file, i) => (
            <Link
              key={file.id}
              href={`/events/${file.event_id}`}
              style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              className="flex flex-col gap-1.5 animate-riseIn"
            >
              <div className="group relative aspect-square overflow-hidden rounded-[9px] border border-[rgba(35,32,28,0.07)]">
                {file.mime_type?.startsWith("image/") ? (
                  <Image
                    src={publicFileUrl(file.bucket, file.storage_path)}
                    alt={file.file_name ?? "media"}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform duration-[380ms] ease-brand group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center font-mono text-[9px] tracking-[0.1em] text-faint uppercase transition-transform duration-[380ms] ease-brand group-hover:scale-[1.04]">
                    {fileTypeLabel(file)}
                  </div>
                )}
              </div>
              <span className="truncate font-sans text-[10px] text-faint">
                {file.events?.name ?? "Untitled event"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
