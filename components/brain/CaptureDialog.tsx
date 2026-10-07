"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { captureNote, createNote } from "@/lib/actions/brain";
import { currentTermKey } from "@/lib/utils/terms";

// Two ways in, on purpose. Writing something up properly opens the editor;
// capturing something someone said, or a link worth keeping, should not
// require opening an editor at all. Both land in the same table and both are
// searchable immediately.
export function CaptureDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function capture() {
    startTransition(async () => {
      const result = await captureNote({ title, body, kind: "note", sourceUrl });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setTitle("");
      setBody("");
      setSourceUrl("");
      setOpen(false);
      toast.success(result.message ?? "Captured");
      router.refresh();
    });
  }

  function writeUp() {
    startTransition(async () => {
      const result = await createNote({
        title: title.trim() || "Untitled",
        kind: "note",
        semester: currentTermKey(),
        visibility: "club",
        sourceUrl: "",
        eventId: null,
        contactId: null,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setOpen(false);
      if (result.noteId) router.push(`/brain/${result.noteId}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="brutalist-border flex h-9 shrink-0 items-center gap-1.5 bg-mint px-4 font-display text-[12px] font-bold tracking-wide uppercase transition-colors duration-200 ease-fluid hover:bg-foreground hover:text-mint">
        <PlusIcon className="size-3.5" />
        Add
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-display text-[18px] font-bold text-foreground">
            Write it down
          </DialogTitle>
          <DialogDescription className="font-sans text-[13px] text-subtle">
            Paste something to capture it, or open the editor to write it up properly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-[15px]">
          <div className="flex flex-col gap-1.5">
            <Label className="t-eyebrow text-foreground/50">Title</Label>
            <Input
              value={title}
              placeholder="What is this about?"
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="t-eyebrow text-foreground/50">Paste it (optional)</Label>
            <Textarea
              value={body}
              placeholder="What was said, what went wrong, what to do differently."
              onChange={(event) => setBody(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="t-eyebrow text-foreground/50">Link (optional)</Label>
            <Input
              value={sourceUrl}
              placeholder="https://…"
              onChange={(event) => setSourceUrl(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !title.trim()}
            onClick={writeUp}
          >
            Open the editor
          </Button>
          <Button
            type="button"
            disabled={isPending || !title.trim() || !body.trim()}
            onClick={capture}
          >
            {isPending ? "Saving" : "Capture"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
