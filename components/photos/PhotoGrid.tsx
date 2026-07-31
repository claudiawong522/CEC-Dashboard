"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { publicFileUrl } from "@/lib/utils/storage";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type MediaFile = {
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

export function PhotoGrid({ files }: { files: MediaFile[] }) {
  const [openFile, setOpenFile] = useState<MediaFile | null>(null);

  return (
    <>
      <div className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {files.map((file, i) => {
          const isImage = file.mime_type?.startsWith("image/");
          const isVideo = file.mime_type?.startsWith("video/");
          return (
            <div
              key={file.id}
              style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              className="flex flex-col gap-1.5 animate-riseIn"
            >
              <button
                type="button"
                onClick={() => setOpenFile(file)}
                className="group relative aspect-square w-full overflow-hidden rounded-[9px] border border-[rgba(35,32,28,0.07)]"
              >
                {isImage ? (
                  <Image
                    src={publicFileUrl(file.bucket, file.storage_path)}
                    alt={file.file_name ?? "media"}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform duration-[380ms] ease-brand group-hover:scale-[1.04]"
                  />
                ) : isVideo ? (
                  <video
                    src={publicFileUrl(file.bucket, file.storage_path)}
                    muted
                    playsInline
                    preload="metadata"
                    className="size-full object-cover transition-transform duration-[380ms] ease-brand group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center font-mono text-[9px] tracking-[0.1em] text-faint uppercase transition-transform duration-[380ms] ease-brand group-hover:scale-[1.04]">
                    {fileTypeLabel(file)}
                  </div>
                )}
              </button>
              <Link
                href={`/events/${file.event_id}`}
                className="truncate font-sans text-[10px] text-faint transition-colors duration-150 hover:text-ink"
              >
                {file.events?.name ?? "Untitled event"}
              </Link>
            </div>
          );
        })}
      </div>

      <Dialog open={!!openFile} onOpenChange={(next) => !next && setOpenFile(null)}>
        <DialogContent
          showCloseButton
          className="max-w-[min(92vw,880px)] border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-[min(92vw,880px)]"
        >
          {openFile && (
            <div className="flex flex-col gap-2.5">
              {openFile.mime_type?.startsWith("image/") ? (
                <div className="relative h-[78vh] w-full overflow-hidden rounded-[9px] bg-ink/5">
                  <Image
                    src={publicFileUrl(openFile.bucket, openFile.storage_path)}
                    alt={openFile.file_name ?? "media"}
                    fill
                    sizes="92vw"
                    className="object-contain"
                  />
                </div>
              ) : openFile.mime_type?.startsWith("video/") ? (
                <video
                  src={publicFileUrl(openFile.bucket, openFile.storage_path)}
                  controls
                  autoPlay
                  className="max-h-[78vh] w-full rounded-[9px] bg-ink/5"
                />
              ) : (
                <div className="flex h-[40vh] items-center justify-center rounded-[9px] bg-ink/5 font-sans text-[13px] text-faint">
                  Preview not available
                </div>
              )}
              <Link
                href={`/events/${openFile.event_id}`}
                className="self-start rounded-btn bg-paper px-2.5 py-1.5 font-sans text-[12px] text-faint transition-colors duration-150 hover:text-ink"
              >
                {openFile.events?.name ?? "Untitled event"}
              </Link>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
