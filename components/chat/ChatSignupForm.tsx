"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitChatRequest } from "@/lib/actions/chatRequests";
import { INTEREST_TAGS, labelForTag } from "@/lib/utils/interests";

const MAX_INTERESTS = 6;

export function ChatSignupForm() {
  const [netid, setNetid] = useState("");
  const [fullName, setFullName] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [major, setMajor] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(tag: string) {
    setInterests((current) =>
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : current.length >= MAX_INTERESTS
          ? current
          : [...current, tag],
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await submitChatRequest({
        netid,
        fullName,
        gradYear,
        major,
        interests: interests as never,
        prompt,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="flex flex-col gap-2.5 border border-line bg-background p-5 shadow-soft">
        <span className="t-eyebrow text-foreground/50">sent</span>
        <p className="t-display text-[28px] text-foreground">
          You&rsquo;re in the queue.
        </p>
        <p className="font-sans text-[13.5px] leading-[1.75] text-subtle">
          A member whose interests line up with yours will pick this up and email
          you at {netid.toLowerCase()}@cornell.edu. No need to do anything else.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 border border-line bg-background p-5 shadow-soft">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="netid">
          Cornell netid
        </Label>
        {/* The suffix is fixed text rather than part of the field: the form only
            ever builds <netid>@cornell.edu, so the address is Cornell by
            construction and there is no wrong domain to type. */}
        <div className="flex items-center gap-2">
          <Input
            id="netid"
            value={netid}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => setNetid(e.target.value)}
            placeholder="abc123"
            className="max-w-[160px] py-3 text-[16px]"
          />
          <span className="font-sans text-[14px] text-foreground/50">@cornell.edu</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">
          Name
        </Label>
        <Input
          id="fullName"
          value={fullName}
          autoComplete="name"
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ada Lovelace"
          className="py-3 text-[16px]"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="major">
            Major <span className="text-foreground/50">(optional)</span>
          </Label>
          <Input
            id="major"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="CS"
            className="py-3 text-[16px]"
          />
        </div>
        <div className="flex w-[130px] flex-col gap-1.5">
          <Label htmlFor="gradYear">
            Grad year <span className="text-foreground/50">(optional)</span>
          </Label>
          <Input
            id="gradYear"
            value={gradYear}
            inputMode="numeric"
            onChange={(e) => setGradYear(e.target.value)}
            placeholder="2029"
            className="py-3 text-[16px]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>
          What are you interested in?{" "}
          <span className="text-foreground/50">
            ({interests.length}/{MAX_INTERESTS})
          </span>
        </Label>
        {/* The same list members pick from on their profile. Matching is the
            overlap between the two, which only works if both sides choose from
            one vocabulary. */}
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_TAGS.map((tag) => {
            const on = interests.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(tag)}
                className={`t-eyebrow border px-2 py-1 transition-[background-color,border-color,color] duration-200 ease-fluid ${
                  on
                    ? "border-foreground bg-mint text-foreground"
                    : "border-line bg-background text-subtle hover:border-foreground hover:text-foreground"
                }`}
              >
                {labelForTag(tag)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prompt">
          What would you like to talk about?
        </Label>
        <Textarea
          id="prompt"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="I'm building a hardware project and want to know how people find cofounders."
          className="text-[16px]"
        />
      </div>

      {error && <p className="font-sans text-[12px] text-red">{error}</p>}

      <div>
        <Button type="button" loading={isPending} onClick={submit} className="px-5 py-3 text-[14px]">
          Ask for a chat
        </Button>
      </div>
    </div>
  );
}
