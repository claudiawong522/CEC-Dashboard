"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { submitChat } from "@/lib/actions/coffeeChats";
import { selfieRejectionReason, SELFIE_BUCKET } from "@/lib/validation/coffee-chat-schemas";
import type { ChatPerson } from "@/lib/types/coffee-chats";

// The picker holds two kinds of person, so the option value carries which kind
// it is. Without the prefix a guest id and a member id are both bare uuids and
// the form cannot tell which column to write.
const GUEST_PREFIX = "guest:";

export function SubmitChatDialog({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  members,
  claimedGuests,
  viewerId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string | null;
  categoryName: string;
  members: ChatPerson[];
  claimedGuests: ChatPerson[];
  viewerId: string;
}) {
  const [partnerId, setPartnerId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  function reset() {
    setPartnerId("");
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  }

  function pickFile(next: File | null) {
    if (!next) return;
    const rejection = selfieRejectionReason(next);
    if (rejection) {
      toast.error(rejection);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  function handleSubmit() {
    if (!partnerId) {
      toast.error("Pick who you chatted with");
      return;
    }
    if (!file) {
      toast.error("Add a selfie");
      return;
    }

    startTransition(async () => {
      // Upload first, then record. The other order would need a row pointing
      // at an object that might never arrive; this way a failed upload leaves
      // nothing behind, and an orphaned object is the cheaper mistake.
      const supabase = createClient();
      const path = `${viewerId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(SELFIE_BUCKET)
        .upload(path, file);

      if (uploadError) {
        toast.error("Couldn't upload that photo — try again");
        return;
      }

      const isGuest = partnerId.startsWith(GUEST_PREFIX);
      const result = await submitChat({
        partnerId: isGuest ? null : partnerId,
        partnerGuestId: isGuest ? partnerId.slice(GUEST_PREFIX.length) : null,
        categoryId,
        storagePath: path,
      });
      if (!result.ok) {
        // The row didn't land, so the object we just uploaded has nothing
        // pointing at it. Clean it up rather than leaving it in the bucket.
        await supabase.storage.from(SELFIE_BUCKET).remove([path]);
        toast.error(result.message);
        return;
      }

      toast.success(result.message ?? "Submitted");
      reset();
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="rounded-card border-line bg-paper sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-[17px] font-medium tracking-[-0.014em] text-ink">
            {categoryName}
          </DialogTitle>
          <DialogDescription className="font-sans text-[12.5px] text-body">
            Log the chat and an admin will approve it onto your board.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-[15px]">
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">
              Who did you chat with?
            </Label>
            {/* base-ui hands back null when a select is cleared; the empty
                string is this form's "nothing picked yet". */}
            <Select value={partnerId} onValueChange={(value) => setPartnerId(value ?? "")}>
              <SelectTrigger className="w-full rounded-input border-line-input bg-page px-3 py-2.5 font-sans text-[13.5px] text-ink">
                <SelectValue placeholder="Pick a member" />
              </SelectTrigger>
              <SelectContent className="max-h-[260px] rounded-card border-line bg-paper shadow-menu ring-0">
                {members.map((member) => (
                  <SelectItem
                    key={member.id}
                    value={member.id}
                    className="font-sans text-[12.5px] focus:bg-wash focus:text-ink"
                  >
                    {member.full_name ?? member.email}
                  </SelectItem>
                ))}
                {/* Chat requests this member claimed. They have no profile, so
                    they can only appear here once someone has taken them out
                    of the pool. */}
                {claimedGuests.map((guest) => (
                  <SelectItem
                    key={guest.id}
                    value={`${GUEST_PREFIX}${guest.id}`}
                    className="font-sans text-[12.5px] focus:bg-wash focus:text-ink"
                  >
                    {guest.full_name ?? guest.email} (prospective)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Selfie</Label>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex min-h-[132px] flex-col items-center justify-center gap-2 overflow-hidden rounded-[10px] border border-dashed border-line-input bg-page transition-colors duration-200 hover:border-[rgba(35,32,28,0.28)] hover:bg-wash"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Your selfie"
                  className="max-h-[180px] w-full object-cover"
                />
              ) : (
                <>
                  <ImagePlusIcon className="size-5 text-faint" />
                  <span className="font-sans text-[12.5px] text-faint">
                    Tap to add a photo of the two of you
                  </span>
                </>
              )}
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-btn border border-[rgba(35,32,28,0.14)] px-[15px] py-[9px] font-sans text-[12.5px] text-body transition-[background-color,border-color,color] duration-200 ease-brand hover:border-[rgba(35,32,28,0.24)] hover:bg-wash hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? "Submitting" : "Submit"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
