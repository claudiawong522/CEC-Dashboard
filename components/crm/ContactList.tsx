"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlarmClockIcon, SearchIcon, HourglassIcon } from "lucide-react";
import { isFollowUpDue, isStale, sortContacts, type ContactWithOrg } from "@/lib/types/crm";
import {
  CONTACT_STATUS_LABELS,
  CONTACT_STATUSES,
  type ContactStatus,
} from "@/lib/validation/crm-schemas";
import { cn } from "@/lib/utils";

export function ContactList({ contacts }: { contacts: ContactWithOrg[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ContactStatus | null>(null);

  const sorted = useMemo(() => sortContacts(contacts), [contacts]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return sorted.filter((contact) => {
      if (status && contact.status !== status) return false;
      if (!term) return true;
      return [contact.name, contact.email, contact.company, contact.organization?.name, contact.title]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [sorted, query, status]);

  const counts = useMemo(() => {
    const map = new Map<ContactStatus, number>();
    for (const contact of contacts) {
      map.set(contact.status, (map.get(contact.status) ?? 0) + 1);
    }
    return map;
  }, [contacts]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-foreground/40" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, company or email"
            className="w-full border border-line bg-background py-2.5 pr-3 pl-8.5 font-sans text-[13.5px] text-foreground placeholder:text-foreground/40 outline-none transition-[border-color] duration-200 ease-fluid hover:border-foreground/40 focus-visible:border-foreground"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {CONTACT_STATUSES.map((value) => {
            const active = status === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(active ? null : value)}
                className={cn(
                  "t-eyebrow flex items-center gap-1.5 border px-2.5 py-1.5 transition-[background-color,border-color,color] duration-200 ease-fluid",
                  active
                    ? "border-foreground bg-mint text-foreground"
                    : "border-line bg-background text-subtle hover:border-foreground hover:text-foreground",
                )}
              >
                {CONTACT_STATUS_LABELS[value]}
                <span className="text-foreground/50">{counts.get(value) ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="border border-line bg-background px-4 py-8 text-center font-sans text-[13px] text-foreground/50 shadow-soft">
          Nobody matches that.
        </p>
      ) : (
        <div className="border border-line bg-background">
          <div className="t-eyebrow grid grid-cols-[1.4fr_1.4fr_1fr_auto] gap-3 border-b border-foreground bg-muted px-4 py-2.5 text-foreground">
            <span>name</span>
            <span>where</span>
            <span>status</span>
            <span>owner</span>
          </div>
          {visible.map((contact, index) => {
            const due = isFollowUpDue(contact);
            const stale = isStale(contact);
            return (
              <Link
                key={contact.id}
                href={`/crm/${contact.id}`}
                className={`grid grid-cols-[1.4fr_1.4fr_1fr_auto] items-center gap-3 px-4 py-3 transition-[background-color,box-shadow] duration-200 ease-fluid hover:bg-muted/40 hover:shadow-[inset_3px_0_0_0_var(--mint)] ${
                  index < visible.length - 1 ? "border-b border-line" : ""
                }`}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-sans text-[13px] font-medium text-foreground">{contact.name}</span>
                  {/* Two different kinds of late: a follow-up date that has
                      passed, and a live contact nobody has touched in a
                      fortnight. Both matter, and they're not the same thing. */}
                  {due && (
                    <AlarmClockIcon
                      className="size-3 shrink-0 text-red"
                      aria-label="Follow-up due"
                    />
                  )}
                  {!due && stale && (
                    <HourglassIcon
                      className="size-3 shrink-0 text-foreground/50"
                      aria-label="Gone quiet"
                    />
                  )}
                </span>
                <span className="truncate font-sans text-[12.5px] text-subtle">
                  {contact.organization?.name ?? contact.company ?? contact.email ?? "—"}
                </span>
                <span className="t-eyebrow truncate text-subtle">
                  {CONTACT_STATUS_LABELS[contact.status]}
                </span>
                <span className="justify-self-end truncate font-sans text-[12px] text-foreground/50">
                  {contact.assignee?.full_name ?? "unassigned"}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <span className="font-sans text-[12px] text-foreground/50">
        Sorted by what needs chasing: follow-ups due, then anyone live who has gone quiet for a
        fortnight, then the rest.
      </span>
    </div>
  );
}
