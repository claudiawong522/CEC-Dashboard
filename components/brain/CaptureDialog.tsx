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
      <DialogTrigger className="flex shrink-0 items-center gap-1.5 rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975]">
        <PlusIcon className="size-3.5" />
        Add
      </DialogTrigger>
      <DialogContent className="rounded-card border-line bg-paper sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-sans text-[17px] font-medium tracking-[-0.014em] text-ink">
            Write it down
          </DialogTitle>
          <DialogDescription className="font-sans text-[12.5px] text-body">
            Paste something to capture it, or open the editor to write it up properly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-[15px]">
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Title</Label>
            <Input
              value={title}
              placeholder="What is this about?"
              onChange={(event) => setTitle(event.target.value)}
              className="bg-page"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">
              Paste it (optional)
            </Label>
            <Textarea
              value={body}
              placeholder="What was said, what went wrong, what to do differently."
              onChange={(event) => setBody(event.target.value)}
              className="bg-page"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="font-sans text-[12px] font-normal text-body">Link (optional)</Label>
            <Input
              value={sourceUrl}
              placeholder="https://…"
              onChange={(event) => setSourceUrl(event.target.value)}
              className="bg-page"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            disabled={isPending || !title.trim()}
            onClick={writeUp}
            className="rounded-btn border border-[rgba(0,0,0,0.14)] px-[15px] py-[9px] font-sans text-[12.5px] text-body transition-[background-color,border-color,color] duration-200 ease-brand hover:border-[rgba(0,0,0,0.24)] hover:bg-wash hover:text-ink disabled:pointer-events-none disabled:opacity-50"
          >
            Open the editor
          </button>
          <button
            type="button"
            disabled={isPending || !title.trim() || !body.trim()}
            onClick={capture}
            className="rounded-btn bg-ink px-[19px] py-[10px] font-sans text-[13px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? "Saving" : "Capture"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
