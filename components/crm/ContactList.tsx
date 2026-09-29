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
    <div className="flex flex-col gap-[15px]">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-faint" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, company or email"
            className="w-full rounded-input border border-line-input bg-paper py-2.5 pr-3 pl-8.5 font-sans text-[13.5px] text-ink placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-[220ms] focus-visible:border-strong focus-visible:ring-[3px] focus-visible:ring-[rgba(35,32,28,0.05)]"
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
                  "flex items-center gap-1.5 rounded-[20px] border px-[11px] py-[6px] font-mono text-[9.5px] tracking-[0.1em] uppercase transition-[background-color,border-color,color] duration-200 ease-brand",
                  active
                    ? "border-transparent bg-cent-tint text-ink"
                    : "border-line-input bg-paper text-body hover:border-[rgba(35,32,28,0.24)] hover:text-ink",
                )}
              >
                {CONTACT_STATUS_LABELS[value]}
                <span className="text-faint">{counts.get(value) ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-card border border-[rgba(35,32,28,0.07)] bg-paper px-[15px] py-8 text-center font-sans text-[13px] text-faint">
          Nobody matches that.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper">
          <div className="grid grid-cols-[1.4fr_1.4fr_1fr_auto] gap-3 border-b border-[rgba(35,32,28,0.08)] px-[15px] py-2.5 font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
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
                className={`grid grid-cols-[1.4fr_1.4fr_1fr_auto] items-center gap-3 px-[15px] py-3 transition-colors duration-200 hover:bg-wash ${
                  index < visible.length - 1 ? "border-b border-[rgba(35,32,28,0.07)]" : ""
                }`}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-sans text-[12.5px] text-ink">{contact.name}</span>
                  {/* Two different kinds of late: a follow-up date that has
                      passed, and a live contact nobody has touched in a
                      fortnight. Both matter, and they're not the same thing. */}
                  {due && (
                    <AlarmClockIcon
                      className="size-3 shrink-0 text-destructive"
                      aria-label="Follow-up due"
                    />
                  )}
                  {!due && stale && (
                    <HourglassIcon
                      className="size-3 shrink-0 text-faint"
                      aria-label="Gone quiet"
                    />
                  )}
                </span>
                <span className="truncate font-sans text-[12px] text-body">
                  {contact.organization?.name ?? contact.company ?? contact.email ?? "—"}
                </span>
                <span className="truncate font-mono text-[9.5px] tracking-[0.1em] text-body uppercase">
                  {CONTACT_STATUS_LABELS[contact.status]}
                </span>
                <span className="justify-self-end truncate font-sans text-[11.5px] text-faint">
                  {contact.assignee?.full_name ?? "unassigned"}
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <span className="font-sans text-[11.5px] text-faint">
        Sorted by what needs chasing: follow-ups due, then anyone live who has gone quiet for a
        fortnight, then the rest.
      </span>
    </div>
  );
}
