"use client";

import { useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { X, UploadCloud, FileIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { recordFileMetadata, deleteFile } from "@/lib/actions/files";
import type { Section } from "@/lib/validation/event-schemas";
import { publicFileUrl } from "@/lib/utils/storage";
import { cn } from "@/lib/utils";

export type UploadedFile = {
  id: string;
  bucket: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
};

export function EvidenceUploader({
  eventId,
  section,
  bucket,
  initialFiles,
  multiple = true,
  accept,
  label = "Drop a screenshot here, or click to upload",
}: {
  eventId: string;
  section: Section;
  bucket: string;
  initialFiles: UploadedFile[];
  multiple?: boolean;
  accept?: Record<string, string[]>;
  label?: string;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);

  async function onDrop(accepted: File[]) {
    if (accepted.length === 0) return;
    setUploading(true);
    const supabase = createClient();

    for (const file of accepted) {
      const path = `${eventId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      try {
        const id = await recordFileMetadata({
          eventId,
          section,
          bucket,
          storagePath: path,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        });
        setFiles((prev) => [
          ...(multiple ? prev : []),
          { id, bucket, storage_path: path, file_name: file.name, mime_type: file.type },
        ]);
      } catch {
        toast.error(`Uploaded ${file.name} but failed to save it — try again`);
      }
    }

    setUploading(false);
  }

  async function handleDelete(fileId: string) {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    try {
      await deleteFile(fileId, eventId);
    } catch {
      toast.error("Couldn't delete file");
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    accept,
  });

  return (
    <div className="flex flex-col gap-2">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-300 px-4 py-6 text-center text-xs text-muted-foreground transition-colors hover:bg-stone-50",
          isDragActive && "border-stone-400 bg-stone-50",
        )}
      >
        <input {...getInputProps()} />
        <UploadCloud className="size-4" />
        <span>{uploading ? "Uploading..." : label}</span>
      </div>

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="group relative flex size-16 items-center justify-center overflow-hidden rounded-md border border-stone-200 bg-stone-50"
            >
              {file.mime_type?.startsWith("image/") ? (
                <Image
                  src={publicFileUrl(file.bucket, file.storage_path)}
                  alt={file.file_name ?? "evidence"}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <FileIcon className="size-5 text-muted-foreground" />
              )}
              <button
                type="button"
                onClick={() => handleDelete(file.id)}
                className="absolute right-0.5 top-0.5 rounded-full bg-white/90 p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
