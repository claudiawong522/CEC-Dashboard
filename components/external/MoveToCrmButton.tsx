"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { moveIdeaToCrm } from "@/lib/actions/external";

export type MovedToCrm = { contactId: string; personId: string | null; name: string | null };

// Shared by the list rows and the detail page. A lead with no contact behind
// it offers "Move to CRM"; once one exists the same spot links to it. The
// server action is idempotent, so a second click can't make a duplicate.
export function MoveToCrmButton({
  ideaId,
  contactId,
  onMoved,
  className,
}: {
  ideaId: string;
  contactId: string | null;
  onMoved?: (moved: MovedToCrm) => void;
  className?: string;
}) {
  const [movedId, setMovedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const linkedId = contactId ?? movedId;

  if (linkedId) {
    return (
      <Link
        href={`/crm/${linkedId}`}
        className={cn(buttonVariants({ variant: "outline", size: "xs" }), className)}
      >
        In CRM →
      </Link>
    );
  }

  function handleMove() {
    startTransition(async () => {
      try {
        const moved = await moveIdeaToCrm(ideaId);
        setMovedId(moved.contactId);
        onMoved?.(moved);
        toast.success("Added to the CRM");
      } catch {
        toast.error("Couldn't move that lead to the CRM. Try again.");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="xs"
      onClick={handleMove}
      disabled={isPending}
      className={className}
    >
      {isPending ? "Moving…" : "Move to CRM"}
    </Button>
  );
}
