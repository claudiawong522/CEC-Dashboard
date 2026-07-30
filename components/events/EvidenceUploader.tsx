"use client";

import { useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { X, FileIcon } from "lucide-react";
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
  dropLabel = "photo evidence",
  label = "Drop a screenshot here, or click to upload",
}: {
  eventId: string;
  section: Section;
  bucket: string;
  initialFiles: UploadedFile[];
  multiple?: boolean;
  accept?: Record<string, string[]>;
  dropLabel?: string;
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
    <div className="flex flex-col gap-2.5">
      <span className="font-mono text-[10px] tracking-[0.13em] text-faint uppercase">
        {dropLabel}
      </span>

      <div
        {...getRootProps()}
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-[10px] border border-dashed border-[rgba(35,32,28,0.16)] px-6 py-6 text-center transition-colors duration-[260ms]",
          isDragActive && "border-coral/50",
        )}
      >
        <input {...getInputProps()} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[120%] left-1/2 h-[150px] w-[260px] -translate-x-1/2 rounded-full opacity-0 blur-[30px] transition-[opacity,transform] duration-500 ease-brand group-hover:-translate-y-[56%] group-hover:opacity-30"
          style={{
            background:
              "radial-gradient(circle, var(--coral), rgba(224,185,74,.7) 40%, rgba(63,167,137,.4) 70%, transparent 80%)",
          }}
        />
        <span className="relative font-sans text-[12px] text-faint">
          {uploading ? "Uploading..." : label}
        </span>
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-[9px]">
          {files.map((file) => (
            <div
              key={file.id}
              className="group/thumb relative flex size-[58px] items-center justify-center overflow-hidden rounded-input border border-[rgba(35,32,28,0.07)] transition-transform duration-[220ms] hover:-translate-y-0.5"
            >
              {file.mime_type?.startsWith("image/") ? (
                <Image
                  src={publicFileUrl(file.bucket, file.storage_path)}
                  alt={file.file_name ?? "evidence"}
                  fill
                  sizes="58px"
                  className="object-cover"
                />
              ) : (
                <FileIcon className="size-4 text-faint" />
              )}
              <button
                type="button"
                onClick={() => handleDelete(file.id)}
                className="absolute top-0.5 right-0.5 rounded-full bg-paper/90 p-0.5 opacity-0 shadow-sm transition-opacity group-hover/thumb:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
