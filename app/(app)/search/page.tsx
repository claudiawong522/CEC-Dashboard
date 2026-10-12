import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/getSession";
import { formatEventDate, formatEventTime } from "@/lib/utils/format-event-time";
import { PageHeader } from "@/components/ui/page-header";
import { TriangleScatter } from "@/components/decor/shapes";
import { SearchResultRow, SearchSection } from "@/components/search/SearchResults";
import { SEARCH_LIMIT_PER_TYPE, ilikeAny, sanitizeSearchTerm, snippetAround } from "@/lib/search";
import { CLUB_NOTES_ID } from "@/lib/types/brain";
import { TEAM_COLORS, TEAM_LABELS, type Team } from "@/lib/validation/member-schemas";
import { CONTACT_STATUS_LABELS, type ContactStatus } from "@/lib/validation/crm-schemas";

type EventResult = {
  id: string;
  name: string;
  event_date: string;
  event_time: string;
  venue: string;
  is_complete: boolean;
};

type MemberResult = {
  id: string;
  full_name: string | null;
  email: string;
  team: Team | null;
  position: string;
  major: string | null;
  graduation_year: number | null;
};

type NoteResult = {
  id: string;
  kind: string;
  title: string;
  body: string;
  semester: string | null;
};

type ContactResult = {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  title: string | null;
  status: ContactStatus;
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const term = sanitizeSearchTerm(query);
  const supabase = await createClient();

  // Every query runs through the caller's session client, so RLS does the
  // filtering: exec-only notes and contacts never come back for a member.
  // The CRM pages themselves are admin-only, so contacts are only searched
  // for admins rather than listing rows whose links would bounce.
  const canSeeCrm = session.profile.role === "admin";

  const [events, members, notes, contacts] = term
    ? await Promise.all([
        supabase
          .from("events")
          .select("id, name, event_date, event_time, venue, is_complete")
          .or(ilikeAny(["name", "venue"], term))
          .order("event_date", { ascending: false })
          .limit(SEARCH_LIMIT_PER_TYPE)
          .returns<EventResult[]>(),
        supabase
          .from("profiles")
          .select("id, full_name, email, team, position, major, graduation_year")
          .neq("status", "revoked")
          .or(ilikeAny(["full_name", "email", "netid", "team", "position", "major", "college"], term))
          .order("full_name", { ascending: true, nullsFirst: false })
          .limit(SEARCH_LIMIT_PER_TYPE)
          .returns<MemberResult[]>(),
        supabase
          .from("brain_notes")
          .select("id, kind, title, body, semester")
          .or(ilikeAny(["title", "body"], term))
          .order("updated_at", { ascending: false })
          .limit(SEARCH_LIMIT_PER_TYPE)
          .returns<NoteResult[]>(),
        canSeeCrm
          ? supabase
              .from("outreach_contacts")
              .select("id, name, email, company, title, status")
              .or(ilikeAny(["name", "company", "email", "title"], term))
              .order("name", { ascending: true })
              .limit(SEARCH_LIMIT_PER_TYPE)
              .returns<ContactResult[]>()
          : Promise.resolve({ data: [] as ContactResult[] }),
      ]).then((results) => results.map((result) => result.data ?? []))
    : [[], [], [], []];

  const eventRows = events as EventResult[];
  const memberRows = members as MemberResult[];
  const noteRows = notes as NoteResult[];
  const contactRows = contacts as ContactResult[];
  const total = eventRows.length + memberRows.length + noteRows.length + contactRows.length;

  const scope = canSeeCrm ? "events, members, notes and contacts" : "events, members and notes";

  return (
    <div className="relative flex flex-col gap-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-40">
        <TriangleScatter count={4} seed={37} opacity={0.2} />
      </div>
      <div className="relative z-10">
        <PageHeader title="Search">
          {term ? (
            <>
              {total} result{total === 1 ? "" : "s"} for &ldquo;{query}&rdquo;
            </>
          ) : (
            `Search ${scope}.`
          )}
        </PageHeader>
      </div>

      {term && total === 0 ? (
        <p className="relative z-10 font-sans text-[14px] text-subtle">
          Nothing matches &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="relative z-10 flex min-w-0 flex-col gap-8">
          <SearchSection id="search-events" label="Events" count={eventRows.length}>
            {eventRows.map((event) => (
              <SearchResultRow
                key={event.id}
                href={`/events/${event.id}`}
                title={event.name}
                subtitle={event.venue}
                meta={
                  <>
                    <span className="t-eyebrow text-subtle">
                      {formatEventDate(event.event_date)} · {formatEventTime(event.event_time)}
                    </span>
                    {event.is_complete && (
                      <span className="t-eyebrow border border-foreground bg-mint px-2 py-0.5 text-foreground">
                        Done
                      </span>
                    )}
                  </>
                }
              />
            ))}
          </SearchSection>

          <SearchSection id="search-members" label="Members" count={memberRows.length}>
            {memberRows.map((member) => (
              <SearchResultRow
                key={member.id}
                href={`/members/${member.id}`}
                title={member.full_name ?? member.email}
                subtitle={member.email}
                swatch={member.team ? TEAM_COLORS[member.team] : undefined}
                meta={
                  <span className="t-eyebrow text-subtle">
                    {[member.team ? TEAM_LABELS[member.team] : null, member.position]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                }
              />
            ))}
          </SearchSection>

          <SearchSection id="search-notes" label="Notes" count={noteRows.length}>
            {noteRows.map((note) => {
              const isClubDoc = note.id === CLUB_NOTES_ID;
              return (
                <SearchResultRow
                  key={note.id}
                  href={isClubDoc ? "/notes" : `/brain/${note.id}`}
                  title={note.title}
                  subtitle={snippetAround(note.body, term) || undefined}
                  meta={
                    <span className="t-eyebrow text-subtle">
                      {[isClubDoc ? "Shared notes" : "Brain", note.semester].filter(Boolean).join(" · ")}
                    </span>
                  }
                />
              );
            })}
          </SearchSection>

          <SearchSection id="search-contacts" label="Contacts" count={contactRows.length}>
            {contactRows.map((contact) => (
              <SearchResultRow
                key={contact.id}
                href={`/crm/${contact.id}`}
                title={contact.name}
                subtitle={
                  [[contact.title, contact.company].filter(Boolean).join(", "), contact.email]
                    .filter(Boolean)
                    .join(" · ") || undefined
                }
                meta={<span className="t-eyebrow text-subtle">{CONTACT_STATUS_LABELS[contact.status]}</span>}
              />
            ))}
          </SearchSection>
        </div>
      )}
    </div>
  );
}
