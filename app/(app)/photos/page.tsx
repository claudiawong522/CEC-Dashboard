import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Tri } from "@/components/decor/shapes";
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
    <div className="relative flex flex-col gap-6">
      <PhotosDecor />
      <PageHeader
        title="Gallery"
        className="relative z-10"
        actions={
          <AddPhotoDialog events={events} className={buttonVariants({ variant: "outline" })}>
            + Add photo
          </AddPhotoDialog>
        }
      />

      {!files || files.length === 0 ? (
        <AddPhotoDialog
          events={events}
          className="group relative flex aspect-square max-w-[220px] flex-col items-center justify-center gap-2 overflow-hidden border-2 border-dashed border-line text-center transition-colors duration-200 ease-fluid hover:border-foreground hover:bg-mint/10"
        >
          <div aria-hidden="true" className="flex items-end gap-1">
            <Tri size={18} color="var(--coral)" />
            <Tri size={22} color="var(--amber)" flip />
            <Tri size={18} color="var(--teal)" />
          </div>
          <span className="px-4 font-sans text-[11px] text-foreground/50">
            No media uploaded yet, click to add a photo
          </span>
        </AddPhotoDialog>
      ) : (
        <PhotoGrid files={files} />
      )}
    </div>
  );
}
