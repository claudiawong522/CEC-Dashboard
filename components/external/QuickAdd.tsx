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
        await createIdea(trimmed);
        setName("");
        router.refresh();
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
