"use client";

import { useTransition } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { toast } from "sonner";
import { setShoutoutHidden } from "@/lib/actions/shoutouts";
import { cn } from "@/lib/utils";

export type ShoutoutRow = {
  id: string;
  message: string;
  is_anonymous: boolean;
  hidden: boolean;
  created_at: string;
  receiver_name: string | null;
  giver: { id: string; full_name: string | null; email: string } | null;
  receiver: { id: string; full_name: string | null; email: string } | null;
};

export function ShoutoutWall({
  shoutouts,
  isAdmin,
}: {
  shoutouts: ShoutoutRow[];
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function toggle(id: string, hidden: boolean) {
    startTransition(async () => {
      const result = await setShoutoutHidden(id, hidden);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message ?? "Done");
    });
  }

  if (shoutouts.length === 0) {
    return (
      <p className="rounded-card border border-[rgba(0,0,0,0.07)] bg-paper px-[15px] py-8 text-center font-sans text-[13px] text-faint">
        Nothing yet this semester. Be the first.
      </p>
    );
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {shoutouts.map((shoutout) => (
        <div
          key={shoutout.id}
          className={cn(
            "group flex flex-col gap-2.5 rounded-card border border-[rgba(0,0,0,0.07)] bg-paper p-[15px]",
            shoutout.hidden && "opacity-50",
          )}
        >
          <p className="font-sans text-[13.5px] leading-[1.75] text-body">{shoutout.message}</p>

          <div className="flex items-center justify-between gap-2">
            <span className="font-sans text-[11.5px] text-faint">
              <span className="font-medium text-ink">
                {shoutout.receiver?.full_name ?? shoutout.receiver?.email ?? shoutout.receiver_name}
              </span>
              {" · from "}
              {/* Anonymity is applied at render for non-admins only. An admin
                  moderating the wall needs to know who wrote something, which
                  is the whole point of being able to hide it. */}
              {shoutout.is_anonymous
                ? isAdmin
                  ? `${shoutout.giver?.full_name ?? shoutout.giver?.email} (anonymous)`
                  : "someone"
                : (shoutout.giver?.full_name ?? shoutout.giver?.email)}
            </span>

            {isAdmin && (
              <button
                type="button"
                disabled={isPending}
                aria-label={shoutout.hidden ? "Restore this shoutout" : "Hide this shoutout"}
                onClick={() => toggle(shoutout.id, !shoutout.hidden)}
                className="shrink-0 rounded-chip p-1 text-faint opacity-0 transition-[opacity,color] duration-200 group-hover:opacity-100 focus-visible:opacity-100 hover:text-ink md:opacity-0"
              >
                {shoutout.hidden ? (
                  <EyeIcon className="size-3.5" />
                ) : (
                  <EyeOffIcon className="size-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
