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
import { Button } from "@/components/ui/button";
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
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {categoryName}
          </DialogTitle>
          <DialogDescription>
            Log the chat and an admin will approve it onto your board.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>
              Who did you chat with?
            </Label>
            {/* base-ui hands back null when a select is cleared; the empty
                string is this form's "nothing picked yet". */}
            <Select
              items={{
                ...Object.fromEntries(
                  members.map((member) => [member.id, member.full_name ?? member.email]),
                ),
                ...Object.fromEntries(
                  claimedGuests.map((guest) => [
                    `${GUEST_PREFIX}${guest.id}`,
                    `${guest.full_name ?? guest.email} (prospective)`,
                  ]),
                ),
              }}
              value={partnerId}
              onValueChange={(value) => setPartnerId(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a member" />
              </SelectTrigger>
              <SelectContent className="max-h-[260px]">
                {members.map((member) => (
                  <SelectItem
                    key={member.id}
                    value={member.id}
                   
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
                   
                  >
                    {guest.full_name ?? guest.email} (prospective)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Selfie</Label>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex min-h-[132px] flex-col items-center justify-center gap-2 overflow-hidden border border-dashed border-line bg-muted/40 transition-colors duration-200 ease-fluid hover:border-foreground"
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
                  <ImagePlusIcon className="size-5 text-foreground/50" />
                  <span className="font-sans text-[12.5px] text-foreground/50">
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={isPending} onClick={handleSubmit}>
            {isPending ? "Submitting" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
