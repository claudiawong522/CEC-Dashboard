"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createIdea } from "@/lib/actions/external";

export function QuickAdd() {
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    startTransition(async () => {
      try {
        const id = await createIdea(trimmed);
        setName("");
        // Straight to the new lead's page rather than back to the list: a
        // name on its own is a stub, and the next thing anyone wants is the
        // contact and the pitch. It also sidesteps the new lead landing at
        // the bottom of the list — Idea is the last live rank — where it
        // can sit below the fold and read as "nothing happened".
        router.push(`/external/${id}`);
      } catch {
        toast.error("Couldn't add that lead — try again");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Add a name — everything else can wait…"
      />
      <Button type="submit" disabled={isPending || !name.trim()}>
        Add idea
      </Button>
    </form>
  );
}
