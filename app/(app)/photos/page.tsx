import { createClient } from "@/lib/supabase/server";
import { Sticker } from "@/components/stickers/Sticker";
import { PhotosDecor } from "@/components/photos/PhotosDecor";
import { AddPhotoDialog } from "@/components/photos/AddPhotoDialog";
import { PhotoGrid, type MediaFile } from "@/components/photos/PhotoGrid";

export default async function PhotosPage() {
  const supabase = await createClient();

  const [{ data: files }, { data: allEvents }] = await Promise.all([
    supabase
      .from("event_files")
      .select(
        "id, event_id, bucket, storage_path, file_name, mime_type, events(name, event_date, event_tagged_members(profiles!event_tagged_members_profile_id_fkey(id, full_name, avatar_url, email)))",
      )
      .eq("section", "media")
      .order("created_at", { ascending: false })
      .returns<MediaFile[]>(),
    supabase
      .from("events")
      .select("id, name, event_date")
      .returns<{ id: string; name: string; event_date: string }[]>(),
  ]);

  // eslint-disable-next-line react-hooks/purity
  const today = Date.now();
  const events = (allEvents ?? []).slice().sort(
    (a, b) =>
      Math.abs(new Date(a.event_date).getTime() - today) -
      Math.abs(new Date(b.event_date).getTime() - today),
  );

  return (
    <div className="relative flex flex-col gap-[17px]">
      <PhotosDecor />
      <div className="relative z-10 flex items-center justify-between">
        <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
          Gallery
        </h1>
        <AddPhotoDialog
          events={events}
          className="-mr-2 rounded-input border border-line-input bg-paper px-[13px] py-[7px] font-sans text-[12.5px] text-body transition-colors duration-200 hover:bg-wash hover:text-ink"
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
        <PhotoGrid files={files} />
      )}
    </div>
  );
}
