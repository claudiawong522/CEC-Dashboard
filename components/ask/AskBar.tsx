"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CornerDownLeftIcon, SparklesIcon } from "lucide-react";
import { ask } from "@/lib/actions/ask";
import type { Citation } from "@/lib/ask/tools";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Who is on the generalist subteam?",
  "What did we learn from the last demo day?",
  "What's coming up this month?",
  "Who has we already reached out to at a VC?",
];

// Citations link back to the record they came from, so an answer is checkable
// rather than something to take on faith. That is the whole reason the tools
// return ids alongside their text.
const CITATION_HREF: Record<Citation["kind"], (id: string) => string | null> = {
  member: (id) => `/members/${id}`,
  note: (id) => `/brain/${id}`,
  contact: (id) => `/crm/${id}`,
  event: (id) => `/events/${id}`,
  interaction: () => null,
  shoutout: () => null,
};

type Answer = {
  question: string;
  answer: string;
  citations: Citation[];
  noRecords: boolean;
};

export function AskBar() {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(value: string) {
    const trimmed = value.trim();
    if (!trimmed || isPending) return;

    setError(null);
    startTransition(async () => {
      const result = await ask(trimmed);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setAnswers((current) => [
        {
          question: trimmed,
          answer: result.answer,
          citations: result.citations,
          noRecords: result.noRecords,
        },
        ...current,
      ]);
      setQuestion("");
    });
  }

  return (
    <div className="flex flex-col gap-[17px]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(question);
        }}
        className="relative"
      >
        <SparklesIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-faint" />
        <input
          value={question}
          disabled={isPending}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything about the club"
          className="w-full rounded-input border border-line-input bg-paper py-3.5 pr-[92px] pl-11 font-sans text-[14.5px] text-ink placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-[220ms] focus-visible:border-strong focus-visible:ring-[3px] focus-visible:ring-[rgba(0,0,0,0.05)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending || !question.trim()}
          className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1.5 rounded-btn bg-ink px-[13px] py-[8px] font-sans text-[12.5px] text-page transition-transform duration-200 ease-brand hover:-translate-y-[calc(50%+2px)] active:scale-[0.975] disabled:pointer-events-none disabled:opacity-40"
        >
          {isPending ? "Asking" : <CornerDownLeftIcon className="size-3.5" />}
        </button>
      </form>

      {error && (
        <p className="rounded-card border border-[rgba(255,0,0,0.28)] bg-coral/10 px-[15px] py-3 font-sans text-[12.5px] text-destructive">
          {error}
        </p>
      )}

      {answers.length === 0 && !isPending && (
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuestion(suggestion);
                submit(suggestion);
              }}
              className="rounded-[20px] border border-line-input bg-paper px-[11px] py-[6px] font-sans text-[12px] text-body transition-[background-color,border-color,color] duration-200 ease-brand hover:border-[rgba(0,0,0,0.24)] hover:bg-wash hover:text-ink"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {answers.map((entry, index) => (
          <div
            key={`${entry.question}-${index}`}
            className={cn(
              "flex flex-col gap-2.5 rounded-card border border-[rgba(0,0,0,0.07)] bg-paper p-[19px]",
              index > 0 && "opacity-70",
            )}
          >
            <span className="font-sans text-[12.5px] text-faint">{entry.question}</span>
            <p className="font-sans text-[13.5px] leading-[1.75] text-body">{entry.answer}</p>

            {entry.citations.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                  from
                </span>
                {entry.citations.map((citation) => {
                  const href = CITATION_HREF[citation.kind](citation.id);
                  const label = (
                    <span className="rounded-[20px] border border-[rgba(0,0,0,0.12)] px-[10px] py-[5px] font-sans text-[11.5px] text-body">
                      {citation.label}
                    </span>
                  );
                  return href ? (
                    <Link
                      key={citation.id}
                      href={href}
                      className="transition-opacity duration-200 hover:opacity-70"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span key={citation.id}>{label}</span>
                  );
                })}
              </div>
            ) : (
              <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                {entry.noRecords ? "no records found" : ""}
              </span>
            )}
          </div>
        ))}
      </div>

      <span className="font-sans text-[11.5px] text-faint">
        Answers come only from the club&rsquo;s own records, and only the ones you can see.
      </span>
    </div>
  );
}
