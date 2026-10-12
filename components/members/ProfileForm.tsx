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
import { Switch } from "@/components/ui/switch";
import { SaveIndicator } from "@/components/events/SaveIndicator";
import { AvatarUploader } from "@/components/members/AvatarUploader";
import { useAutoSave } from "@/lib/hooks/use-autosave";
import { updateOwnProfile } from "@/lib/actions/members";
import {
  TEAMS,
  TEAM_LABELS,
  type ProfileFieldErrors,
  type Team,
} from "@/lib/validation/member-schemas";
import { memberInitials, type MemberProfile } from "@/lib/types/members";

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
  hometown: string;
  about: string;
  hobbies: string;
  building: string;
  linkedin_url: string;
  portfolio_url: string;
  github_url: string;
  show_on_site: boolean;
  show_email_on_site: boolean;
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
    hometown: member.hometown ?? "",
    about: member.about ?? "",
    hobbies: member.hobbies ?? "",
    building: member.building ?? "",
    linkedin_url: member.linkedin_url ?? "",
    portfolio_url: member.portfolio_url ?? "",
    github_url: member.github_url ?? "",
    show_on_site: member.show_on_site,
    show_email_on_site: member.show_email_on_site,
  };
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <span role="alert" className="font-sans text-[11.5px] text-red">
          {error}
        </span>
      ) : (
        hint && <span className="font-sans text-[11.5px] text-foreground/50">{hint}</span>
      )}
    </div>
  );
}

export function ProfileForm({ member }: { member: MemberProfile }) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(member));
  // Per-field problems from the last save. The other fields still saved;
  // these show under their own input instead of a toast per keystroke.
  const [errors, setErrors] = useState<ProfileFieldErrors>({});

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
      hobbies: value.hobbies,
      building: value.building,
      linkedin_url: value.linkedin_url,
      portfolio_url: value.portfolio_url,
      github_url: value.github_url,
      show_on_site: value.show_on_site,
      show_email_on_site: value.show_email_on_site,
    });
    setErrors(result.fieldErrors ?? {});
    if (!result.ok) {
      // One id, so repeated failures replace the toast instead of stacking.
      toast.error(result.message, { id: "profile-save" });
      // Rejecting here keeps the indicator on "Couldn't save" rather than
      // flashing a green check for a write the server refused.
      throw new Error(result.message);
    }
  });

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="flex flex-col gap-4 border border-line bg-background p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="t-eyebrow text-foreground/50">
          about you
        </span>
        <SaveIndicator status={status} />
      </div>

      <AvatarUploader
        memberId={member.id}
        initialUrl={member.avatar_url}
        initials={memberInitials(member)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={errors.full_name}>
          <Input
            value={draft.full_name}
            aria-invalid={!!errors.full_name}
            onChange={(e) => set("full_name", e.target.value)}
          />
        </Field>
        <Field label="Pronouns">
          <Input
            value={draft.pronouns}
            placeholder="she/her, he/him, they/them"
            onChange={(e) => set("pronouns", e.target.value)}
          />
        </Field>
        <Field label="Netid" hint="Used to match you to interview slots." error={errors.netid}>
          <Input
            value={draft.netid}
            aria-invalid={!!errors.netid}
            placeholder="ab123"
            onChange={(e) => set("netid", e.target.value)}
          />
        </Field>
        {/* Position decides where cornellec.com lists someone, so only an
            admin sets it (from /admin); the database refuses it from here too. */}
        <Field label="Position" hint="Set by an admin.">
          <p className="flex items-center border border-line bg-muted px-3 py-2.5 font-sans text-[14px] text-foreground max-md:min-h-11 max-md:text-[16px]">
            {member.position}
          </p>
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
        <Field label="Graduation year" error={errors.graduation_year}>
          <Input
            value={draft.graduation_year}
            aria-invalid={!!errors.graduation_year}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hobbies">
          <Input
            value={draft.hobbies}
            placeholder="Hiking, lifting, music"
            onChange={(e) => set("hobbies", e.target.value)}
          />
        </Field>
        <Field label="Building" hint="A startup, a project, or a domain.">
          <Input
            value={draft.building}
            placeholder="loadstonelabs.com"
            onChange={(e) => set("building", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="LinkedIn" error={errors.linkedin_url}>
          <Input
            value={draft.linkedin_url}
            aria-invalid={!!errors.linkedin_url}
            placeholder="https://linkedin.com/in/…"
            onChange={(e) => set("linkedin_url", e.target.value)}
          />
        </Field>
        <Field label="Portfolio" error={errors.portfolio_url}>
          <Input
            value={draft.portfolio_url}
            aria-invalid={!!errors.portfolio_url}
            placeholder="https://…"
            onChange={(e) => set("portfolio_url", e.target.value)}
          />
        </Field>
        <Field label="GitHub" error={errors.github_url}>
          <Input
            value={draft.github_url}
            aria-invalid={!!errors.github_url}
            placeholder="https://github.com/…"
            onChange={(e) => set("github_url", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line pt-4">
        <div className="flex flex-col gap-0.5">
          <Label>Show on cornellec.com</Label>
          <span className="font-sans text-[11.5px] text-foreground/50">
            Off until you turn it on. When on, everything you fill in here appears on the public
            members page. Email and netid never do, unless you turn on the email button below.
            Turning it off removes you from the site entirely.
          </span>
        </div>
        <Switch
          checked={draft.show_on_site}
          onCheckedChange={(checked) => set("show_on_site", checked)}
        />
      </div>

      <div
        className={`flex items-center justify-between gap-4 border-t border-line pt-4 transition-opacity duration-200 ease-fluid ${
          draft.show_on_site ? "" : "opacity-50"
        }`}
      >
        <div className="flex flex-col gap-0.5">
          <Label>Email button on cornellec.com</Label>
          <span className="font-sans text-[11.5px] text-foreground/50">
            Off until you turn it on. Lets visitors email you from your profile on the members
            page, which makes your address public. Only applies while you are shown on the site.
          </span>
        </div>
        <Switch
          checked={draft.show_email_on_site}
          // Greyed out, but it keeps its setting for when the site is back on.
          disabled={!draft.show_on_site}
          onCheckedChange={(checked) => set("show_email_on_site", checked)}
        />
      </div>
    </div>
  );
}
