"use client";

import { useState, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCategory, deleteCategory } from "@/lib/actions/coffeeChats";
import type { ChatCategory } from "@/lib/types/coffee-chats";

// Admin-only board setup, styled off InviteForm: same card shell as the
// surface it sits above, an eyebrow label, and a plain inline form
// rather than a dialog, since adding four squares in a row shouldn't mean
// opening and closing a modal four times.
export function CategoryManager({ categories }: { categories: ChatCategory[] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!name.trim()) {
      toast.error("Give the square a label");
      return;
    }
    startTransition(async () => {
      const result = await createCategory({ name, description });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setName("");
      setDescription("");
      toast.success("Square added");
    });
  }

  function remove(categoryId: string, label: string) {
    startTransition(async () => {
      const result = await deleteCategory(categoryId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? `Removed ${label}`);
    });
  }

  return (
    <div className="flex flex-col gap-2.5 border border-line bg-background p-4 shadow-soft">
      <span className="t-eyebrow text-foreground/50">
        board squares
      </span>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          placeholder="Someone on another subteam"
          onChange={(event) => setName(event.target.value)}
          className="sm:max-w-[260px]"
        />
        <Input
          value={description}
          placeholder="Optional hint"
          onChange={(event) => setDescription(event.target.value)}
          className="flex-1"
        />
        <Button type="button" disabled={isPending} onClick={add} className="shrink-0">
          <PlusIcon className="size-3.5" />
          Add
        </Button>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <span
              key={category.id}
              className="t-eyebrow flex items-center gap-1.5 border border-line px-2 py-0.5 text-foreground"
            >
              {category.name}
              <button
                type="button"
                disabled={isPending}
                aria-label={`Remove ${category.name}`}
                onClick={() => remove(category.id, category.name)}
                className="transition-colors duration-200 hover:text-red"
              >
                <Trash2Icon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <span className="font-sans text-[11.5px] text-foreground/50">
        Removing a square keeps any chats logged against it, as uncategorised.
      </span>
    </div>
  );
}
