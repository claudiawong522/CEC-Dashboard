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
    <div className="flex flex-col gap-5">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(question);
        }}
        className="relative"
      >
        <SparklesIcon className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground/40" />
        <input
          value={question}
          disabled={isPending}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask anything about the club"
          className="w-full border-2 border-foreground bg-background py-3.5 pr-[92px] pl-11 font-sans text-[15px] text-foreground placeholder:text-foreground/40 outline-none transition-[box-shadow] duration-200 ease-fluid focus-visible:shadow-mint-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending || !question.trim()}
          className="brutalist-border absolute top-1/2 right-2 flex h-8 -translate-y-1/2 items-center gap-1.5 bg-mint px-3 font-display text-[11px] font-bold tracking-wide uppercase transition-colors duration-200 ease-fluid hover:bg-foreground hover:text-mint active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
        >
          {isPending ? "Asking" : <CornerDownLeftIcon className="size-3.5" />}
        </button>
      </form>

      {error && (
        <p className="border border-red/40 bg-red/5 px-4 py-3 font-sans text-[13px] text-red">
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
              className="border border-line bg-background px-3 py-1.5 font-sans text-[12px] text-subtle transition-[background-color,border-color,color] duration-200 ease-fluid hover:border-foreground hover:bg-muted/40 hover:text-foreground"
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
              "flex flex-col gap-2.5 border border-line bg-background p-5 shadow-soft",
              index > 0 && "opacity-70",
            )}
          >
            <span className="font-sans text-[13px] text-foreground/50">{entry.question}</span>
            <p className="font-sans text-[14px] leading-[1.75] text-subtle">{entry.answer}</p>

            {entry.citations.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="t-eyebrow text-foreground/50">
                  from
                </span>
                {entry.citations.map((citation) => {
                  const href = CITATION_HREF[citation.kind](citation.id);
                  const label = (
                    <span className="border border-line px-2.5 py-1 font-sans text-[12px] text-subtle transition-colors duration-200 ease-fluid">
                      {citation.label}
                    </span>
                  );
                  return href ? (
                    <Link
                      key={citation.id}
                      href={href}
                      className="[&>span]:hover:border-foreground [&>span]:hover:text-foreground"
                    >
                      {label}
                    </Link>
                  ) : (
                    <span key={citation.id}>{label}</span>
                  );
                })}
              </div>
            ) : (
              <span className="t-eyebrow text-foreground/50">
                {entry.noRecords ? "no records found" : ""}
              </span>
            )}
          </div>
        ))}
      </div>

      <span className="font-sans text-[12px] text-foreground/50">
        Answers come only from the club&rsquo;s own records, and only the ones you can see.
      </span>
    </div>
  );
}
