"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { updateOwnProfile } from "@/lib/actions/members";
import { TEAMS, TEAM_LABELS, type Team } from "@/lib/validation/member-schemas";
import type { MemberProfile } from "@/lib/types/members";

// Everything on this card auto-saves 700ms after the last keystroke, the same
// contract as the event-details fields. A Save button here would be the only
// one left in the app.
//
// The form holds strings for every field, including graduation_year, because
// that's what an input gives back; the schema coerces on the way to the
// server. Keeping the draft as-typed means a half-entered "20" doesn't get
// rewritten under the cursor.
type Draft = {
  full_name: string;
  netid: string;
  pronouns: string;
  major: string;
  minor: string;
  college: string;
  graduation_year: string;
  team: Team | "none";
  position: string;
  hometown: string;
  about: string;
  linkedin_url: string;
  portfolio_url: string;
};

function toDraft(member: MemberProfile): Draft {
  return {
    full_name: member.full_name ?? "",
    netid: member.netid ?? "",
    pronouns: member.pronouns ?? "",
    major: member.major ?? "",
    minor: member.minor ?? "",
    college: member.college ?? "",
    graduation_year: member.graduation_year ? String(member.graduation_year) : "",
    team: member.team ?? "none",
    position: member.position,
    hometown: member.hometown ?? "",
    about: member.about ?? "",
    linkedin_url: member.linkedin_url ?? "",
    portfolio_url: member.portfolio_url ?? "",
  };
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="font-sans text-[12px] font-normal text-body">{label}</Label>
      {children}
      {hint && <span className="font-sans text-[11.5px] text-faint">{hint}</span>}
    </div>
  );
}

export function ProfileForm({ member }: { member: MemberProfile }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(member));

  const status = useAutoSave(draft, async (value) => {
    const result = await updateOwnProfile({
      ...value,
      team: value.team === "none" ? null : value.team,
      // The schema does the trimming and empty-string-to-null work; these
      // are passed through as typed so its transforms are the only place
      // that logic lives.
      netid: value.netid,
      pronouns: value.pronouns,
      major: value.major,
      minor: value.minor,
      college: value.college,
      graduation_year: value.graduation_year,
      hometown: value.hometown,
      about: value.about,
      linkedin_url: value.linkedin_url,
      portfolio_url: value.portfolio_url,
    });
    if (!result.ok) {
      toast.error(result.message);
      // Rejecting here keeps the indicator on "Couldn't save" rather than
      // flashing a green check for a write the server refused.
      throw new Error(result.message);
    }
  });

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-[15px] rounded-card border border-[rgba(35,32,28,0.07)] bg-paper p-[19px]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
          about you
        </span>
        <SaveIndicator status={status} />
      </div>

      <div className="grid gap-[15px] sm:grid-cols-2">
        <Field label="Name">
          <Input value={draft.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </Field>
        <Field label="Pronouns">
          <Input
            value={draft.pronouns}
            placeholder="she/her, he/him, they/them"
            onChange={(e) => set("pronouns", e.target.value)}
          />
        </Field>
        <Field label="Netid" hint="Used to match you to interview slots.">
          <Input
            value={draft.netid}
            placeholder="ab123"
            onChange={(e) => set("netid", e.target.value)}
          />
        </Field>
        <Field label="Position">
          <Input
            value={draft.position}
            placeholder="Member"
            onChange={(e) => set("position", e.target.value)}
          />
        </Field>
        <Field label="Subteam">
          <Select
            items={{ none: "No subteam", ...TEAM_LABELS }}
            value={draft.team}
            onValueChange={(value) => set("team", value as Team | "none")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                No subteam
              </SelectItem>
              {TEAMS.map((team) => (
                <SelectItem
                  key={team}
                  value={team}
                 
                >
                  {TEAM_LABELS[team]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Graduation year">
          <Input
            value={draft.graduation_year}
            inputMode="numeric"
            placeholder="2027"
            onChange={(e) => set("graduation_year", e.target.value)}
          />
        </Field>
        <Field label="Major">
          <Input value={draft.major} onChange={(e) => set("major", e.target.value)} />
        </Field>
        <Field label="Minor">
          <Input value={draft.minor} onChange={(e) => set("minor", e.target.value)} />
        </Field>
        <Field label="College">
          <Input
            value={draft.college}
            placeholder="Engineering, CAS, Dyson"
            onChange={(e) => set("college", e.target.value)}
          />
        </Field>
        <Field label="Hometown">
          <Input value={draft.hometown} onChange={(e) => set("hometown", e.target.value)} />
        </Field>
      </div>

      <Field label="About">
        <Textarea
          value={draft.about}
          placeholder="What you're working on, what you like building."
          onChange={(e) => set("about", e.target.value)}
        />
      </Field>

      <div className="grid gap-[15px] sm:grid-cols-2">
        <Field label="LinkedIn">
          <Input
            value={draft.linkedin_url}
            placeholder="https://linkedin.com/in/…"
            onChange={(e) => set("linkedin_url", e.target.value)}
          />
        </Field>
        <Field label="Portfolio">
          <Input
            value={draft.portfolio_url}
            placeholder="https://…"
            onChange={(e) => set("portfolio_url", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
