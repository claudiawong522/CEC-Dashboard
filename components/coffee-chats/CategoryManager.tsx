"use client";

import { useState, useTransition } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { createCategory, deleteCategory } from "@/lib/actions/coffeeChats";
import type { ChatCategory } from "@/lib/types/coffee-chats";

// Admin-only board setup, styled off InviteForm: same card shell as the
// surface it sits above, a mono uppercase label, and a plain inline form
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
    <div className="flex flex-col gap-2.5 rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-paper p-[15px]">
      <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
        board squares
      </span>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          placeholder="Someone on another subteam"
          onChange={(event) => setName(event.target.value)}
          className="bg-page sm:max-w-[260px]"
        />
        <Input
          value={description}
          placeholder="Optional hint"
          onChange={(event) => setDescription(event.target.value)}
          className="flex-1 bg-page"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={add}
          className="flex shrink-0 items-center gap-1.5 rounded-btn bg-ink px-[15px] py-[9px] font-sans text-[12.5px] text-page transition-transform duration-200 ease-brand hover:-translate-y-0.5 active:scale-[0.975] disabled:pointer-events-none disabled:opacity-50"
        >
          <PlusIcon className="size-3.5" />
          Add
        </button>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <span
              key={category.id}
              className="flex items-center gap-1.5 rounded-[20px] border border-[rgba(0,0,0,0.12)] px-[10px] py-[5px] font-mono text-[9px] tracking-[0.13em] text-body uppercase"
            >
              {category.name}
              <button
                type="button"
                disabled={isPending}
                aria-label={`Remove ${category.name}`}
                onClick={() => remove(category.id, category.name)}
                className="transition-colors duration-200 hover:text-destructive"
              >
                <Trash2Icon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <span className="font-sans text-[11.5px] text-faint">
        Removing a square keeps any chats logged against it, as uncategorised.
      </span>
    </div>
  );
}
