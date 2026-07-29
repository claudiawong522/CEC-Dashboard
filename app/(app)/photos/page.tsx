import Image from "next/image";
import Link from "next/link";
import { FileIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { publicFileUrl } from "@/lib/utils/storage";

type MediaFile = {
  id: string;
  event_id: string;
  bucket: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  events: { name: string; event_date: string } | null;
};

export default async function PhotosPage() {
  const supabase = await createClient();

  const { data: files } = await supabase
    .from("event_files")
    .select("id, event_id, bucket, storage_path, file_name, mime_type, events(name, event_date)")
    .eq("section", "media")
    .order("created_at", { ascending: false })
    .returns<MediaFile[]>();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-medium tracking-tight">Photos</h1>

      {!files || files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {files.map((file) => (
            <li key={file.id}>
              <Link
                href={`/events/${file.event_id}`}
                className="group flex flex-col gap-1.5"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                  {file.mime_type?.startsWith("image/") ? (
                    <Image
                      src={publicFileUrl(file.bucket, file.storage_path)}
                      alt={file.file_name ?? "media"}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <FileIcon className="size-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="truncate text-xs text-muted-foreground">
                  {file.events?.name ?? "Untitled event"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
