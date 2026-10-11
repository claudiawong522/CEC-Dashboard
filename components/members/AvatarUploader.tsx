"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { updateOwnAvatar } from "@/lib/actions/members";
import { publicFileUrl } from "@/lib/utils/storage";
import { Button } from "@/components/ui/button";

const SIZE = 1200;
const QUALITY = 0.9;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

// Centre-crops and downsizes in the browser to a 1200px square webp at 0.9,
// large and sharp enough for cornellec.com's member photos while a 6 MB phone
// photo still lands in storage at a few hundred KB. A smaller source is kept
// at its own size rather than upscaled. Only the current photo is kept (see
// clearOldPhotos), so the public bucket holds one file per member.
async function toSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;
  const out = Math.min(SIZE, side);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out);
  bitmap.close();
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode the image"))),
      "image/webp",
      QUALITY,
    );
  });
}

// Best effort: removes every object in the member's avatars folder except
// `keep`, so a replaced or removed photo doesn't linger in the public bucket.
// A failure here only leaves an orphan behind, so it is not reported.
async function clearOldPhotos(memberId: string, keep: string | null) {
  try {
    const supabase = createClient();
    const folder = `avatars/${memberId}`;
    const { data } = await supabase.storage.from("portraits").list(folder);
    const stale = (data ?? []).map((o) => `${folder}/${o.name}`).filter((path) => path !== keep);
    if (stale.length) await supabase.storage.from("portraits").remove(stale);
  } catch {
    // ignored on purpose
  }
}

export function AvatarUploader({
  memberId,
  initialUrl,
  initials,
}: {
  memberId: string;
  initialUrl: string | null;
  initials: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      toast.error("That image is over 15 MB");
      return;
    }
    setBusy(true);
    try {
      const blob = await toSquareWebp(file);
      const path = `avatars/${memberId}/${Date.now()}.webp`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("portraits")
        .upload(path, blob, { contentType: "image/webp", upsert: true });
      if (error) throw new Error(error.message);
      const publicUrl = publicFileUrl("portraits", path);
      const result = await updateOwnAvatar(publicUrl);
      if (!result.ok) throw new Error(result.message);
      setUrl(publicUrl);
      toast.success("Photo updated");
      void clearOldPhotos(memberId, path);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't upload that photo");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onRemove() {
    setBusy(true);
    const result = await updateOwnAvatar(null);
    setBusy(false);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setUrl(null);
    toast.success("Photo removed");
    void clearOldPhotos(memberId, null);
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative size-24 shrink-0 overflow-hidden border-2 border-foreground bg-muted/40">
        {url ? (
          <Image src={url} alt="" fill sizes="96px" className="object-cover" unoptimized />
        ) : (
          <span className="flex size-full items-center justify-center font-display text-[24px] font-bold text-foreground">
            {initials}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={busy}
            onClick={() => inputRef.current?.click()}
          >
            {url ? "Change photo" : "Upload photo"}
          </Button>
          {url && (
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onRemove}>
              Remove
            </Button>
          )}
        </div>
        <span className="font-sans text-[11.5px] text-foreground/50">
          Square crop, shown in the directory and on cornellec.com.
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
