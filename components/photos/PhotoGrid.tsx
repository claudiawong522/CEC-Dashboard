"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { publicFileUrl } from "@/lib/utils/storage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

type TaggedMember = { id: string; full_name: string | null; avatar_url: string | null; email: string };

export type MediaFile = {
  id: string;
  event_id: string;
  bucket: string;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  events: {
    name: string;
    event_date: string;
    event_tagged_members: { profiles: TaggedMember | null }[];
  } | null;
};

function initials(member: TaggedMember) {
  const source = member.full_name ?? member.email;
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function fileTypeLabel(file: MediaFile) {
  const ext = file.file_name?.split(".").pop();
  if (ext) return ext.toLowerCase();
  if (file.mime_type?.startsWith("video/")) return "video";
  return "file";
}

export function PhotoGrid({ files }: { files: MediaFile[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openFile = openIndex !== null ? files[openIndex] : null;

  function go(delta: number) {
    setOpenIndex((i) => (i === null ? i : (i + delta + files.length) % files.length));
  }

  useEffect(() => {
    if (openIndex === null) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex, files.length]);

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
                onClick={() => setOpenIndex(i)}
                className="group relative aspect-square w-full overflow-hidden border border-line bg-background transition-[box-shadow,transform,border-color] duration-300 ease-fluid hover:-translate-y-1 hover:border-foreground hover:shadow-mint"
              >
                {isImage ? (
                  <Image
                    src={publicFileUrl(file.bucket, file.storage_path)}
                    alt={file.file_name ?? "media"}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform duration-[380ms] ease-fluid group-hover:scale-[1.04]"
                  />
                ) : isVideo ? (
                  <video
                    src={publicFileUrl(file.bucket, file.storage_path)}
                    muted
                    playsInline
                    preload="metadata"
                    className="size-full object-cover transition-transform duration-[380ms] ease-fluid group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="t-eyebrow flex size-full items-center justify-center text-foreground/50 transition-transform duration-[380ms] ease-fluid group-hover:scale-[1.04]">
                    {fileTypeLabel(file)}
                  </div>
                )}
              </button>
              <Link
                href={`/events/${file.event_id}`}
                className="truncate font-sans text-[11px] text-foreground/50 transition-colors duration-150 ease-fluid hover:text-foreground"
              >
                {file.events?.name ?? "Untitled event"}
              </Link>
            </div>
          );
        })}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(next) => !next && setOpenIndex(null)}>
        <DialogContent
          showCloseButton
          className="max-w-[min(92vw,880px)] border-none bg-transparent p-0 shadow-none ring-0 sm:max-w-[min(92vw,880px)]"
        >
          {openFile && (
            <div className="flex flex-col gap-2.5">
              <div className="relative">
                {files.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => go(-1)}
                      aria-label="Previous photo"
                      className="absolute top-1/2 left-2 z-10 flex size-9 -translate-y-1/2 items-center justify-center border-2 border-foreground bg-background text-foreground transition-colors duration-200 ease-fluid hover:bg-foreground hover:text-mint"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => go(1)}
                      aria-label="Next photo"
                      className="absolute top-1/2 right-2 z-10 flex size-9 -translate-y-1/2 items-center justify-center border-2 border-foreground bg-background text-foreground transition-colors duration-200 ease-fluid hover:bg-foreground hover:text-mint"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                )}
                {openFile.mime_type?.startsWith("image/") ? (
                  <div className="relative h-[78vh] w-full overflow-hidden bg-foreground/5">
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
                    className="max-h-[78vh] w-full bg-foreground/5"
                  />
                ) : (
                  <div className="flex h-[40vh] items-center justify-center bg-foreground/5 font-sans text-[13px] text-foreground/50">
                    Preview not available
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                {files.length > 1 && (
                  <span className="t-eyebrow self-start text-foreground/50">
                    {(openIndex ?? 0) + 1} / {files.length}
                  </span>
                )}
                <Link
                  href={`/events/${openFile.event_id}`}
                  className="self-start border border-line bg-background px-2.5 py-1.5 font-sans text-[12px] text-foreground/50 transition-colors duration-150 ease-fluid hover:border-foreground hover:text-foreground"
                >
                  {openFile.events?.name ?? "Untitled event"}
                </Link>
                {openFile.events?.event_tagged_members
                  .flatMap((row) => (row.profiles ? [row.profiles] : []))
                  .map((member) => (
                    <span
                      key={member.id}
                      className="flex items-center gap-1.5 border border-line bg-background py-1 pr-2.5 pl-1"
                    >
                      <Avatar size="sm">
                        <AvatarImage src={member.avatar_url ?? undefined} alt="" />
                        <AvatarFallback className="font-sans text-[9px]">
                          {initials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-sans text-[11.5px] text-foreground/50">
                        {member.full_name ?? member.email}
                      </span>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
