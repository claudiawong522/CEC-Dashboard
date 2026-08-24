"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/requireRole";
import { createClient } from "@/lib/supabase/server";
import type { Section } from "@/lib/validation/event-schemas";

export async function recordFileMetadata(input: {
  eventId: string;
  section: Section;
  bucket: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
}) {
  const session = await requireRole("edit");
  const supabase = await createClient();

  const { data: file, error } = await supabase
    .from("event_files")
    .insert({
      event_id: input.eventId,
      section: input.section,
      bucket: input.bucket,
      storage_path: input.storagePath,
      file_name: input.fileName,
      mime_type: input.mimeType,
      file_size: input.fileSize,
      uploaded_by: session.user.id,
    })
    .select("id")
    .single();

  if (error || !file) throw new Error(error?.message ?? "Failed to record file");

  if (input.section === "speaker_portrait") {
    await supabase
      .from("event_speaker")
      .update({ portrait_file_id: file.id })
      .eq("event_id", input.eventId);
  }

  revalidatePath(`/events/${input.eventId}`);
  if (input.section === "media") revalidatePath("/photos");

  return file.id as string;
}

export async function deleteFile(fileId: string, eventId: string) {
  await requireRole("edit");
  const supabase = await createClient();

  const { data: file } = await supabase
    .from("event_files")
    .select("bucket, storage_path, section")
    .eq("id", fileId)
    .single();

  if (file) {
    const { data: removed, error: removeError } = await supabase.storage
      .from(file.bucket)
      .remove([file.storage_path]);
    // Same silent-success trap as deleteEvent: an unmatched path comes back as
    // an empty array rather than an error.
    if (removeError || !removed?.length) {
      console.error(
        `[files] couldn't remove ${file.storage_path} from ${file.bucket}:`,
        removeError?.message ?? "no error reported, the object did not match",
      );
    }
    await supabase.from("event_files").delete().eq("id", fileId);
  }

  revalidatePath(`/events/${eventId}`);
  if (file?.section === "media") revalidatePath("/photos");
}
