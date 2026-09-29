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
      <div className="flex flex-col gap-[9px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[19px]">
        <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">sent</span>
        <p className="font-sans text-[23px] leading-[1.3] font-medium tracking-[-0.02em] text-ink">
          You&rsquo;re in the queue.
        </p>
        <p className="font-sans text-[13.5px] leading-[1.75] text-body">
          A member whose interests line up with yours will pick this up and email
          you at {netid.toLowerCase()}@cornell.edu. No need to do anything else.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[15px] rounded-[10px] border border-[rgba(35,32,28,0.1)] bg-paper p-[19px]">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="netid" className="font-sans text-[12px] font-normal text-body">
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
          <span className="font-mono text-[13px] text-faint">@cornell.edu</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName" className="font-sans text-[12px] font-normal text-body">
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

      <div className="flex gap-[11px]">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="major" className="font-sans text-[12px] font-normal text-body">
            Major <span className="text-faint">(optional)</span>
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
          <Label htmlFor="gradYear" className="font-sans text-[12px] font-normal text-body">
            Grad year <span className="text-faint">(optional)</span>
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

      <div className="flex flex-col gap-[7px]">
        <Label className="font-sans text-[12px] font-normal text-body">
          What are you interested in?{" "}
          <span className="text-faint">
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
                className={`rounded-[20px] border px-[11px] py-[6px] font-sans text-[12px] transition-[background-color,border-color,color] duration-200 ease-brand ${
                  on
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-line-input bg-page text-body hover:border-[rgba(35,32,28,0.24)] hover:text-ink"
                }`}
              >
                {labelForTag(tag)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="prompt" className="font-sans text-[12px] font-normal text-body">
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

      {error && <p className="font-sans text-[12px] text-destructive">{error}</p>}

      <div>
        <Button type="button" loading={isPending} onClick={submit} className="px-5 py-3 text-[14px]">
          Ask for a chat
        </Button>
      </div>
    </div>
  );
}
