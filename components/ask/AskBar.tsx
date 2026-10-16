"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CornerDownLeftIcon, SparklesIcon } from "lucide-react";
import { AskAnswer, CITATION_HREF } from "@/components/ask/AskAnswer";
import { ask } from "@/lib/actions/ask";
import type { Citation } from "@/lib/ask/tools";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Who is on the generalist subteam?",
  "What did we learn from the last demo day?",
  "What's coming up this month?",
  "Who have we already reached out to at a VC?",
];

const KIND_LABEL: Record<Citation["kind"], string> = {
  member: "Members",
  event: "Events",
  note: "Notes",
  contact: "Contacts",
  interaction: "Outreach",
  shoutout: "Shoutouts",
};

/** One chip per record, grouped by kind in a stable order. Tools can return
 * the same record twice when the model calls more than one of them. */
function groupCitations(citations: Citation[]) {
  const seen = new Set<string>();
  const groups = new Map<Citation["kind"], Citation[]>();
  for (const citation of citations) {
    const key = `${citation.kind}:${citation.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    groups.set(citation.kind, [...(groups.get(citation.kind) ?? []), citation]);
  }
  return (Object.keys(KIND_LABEL) as Citation["kind"][])
    .filter((kind) => groups.has(kind))
    .map((kind) => ({ kind, items: groups.get(kind)! }));
}

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
          className="w-full border-2 border-foreground bg-background py-3.5 pr-[92px] pl-11 font-sans text-[15px] text-foreground max-md:text-[16px] placeholder:text-foreground/40 outline-none transition-[box-shadow] duration-200 ease-fluid focus-visible:shadow-mint-sm disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending || !question.trim()}
          className="brutalist-border absolute top-1/2 right-2 flex h-8 -translate-y-1/2 items-center justify-center gap-1.5 bg-mint px-3 font-display max-md:right-1 max-md:h-11 max-md:min-w-11 text-[11px] font-bold tracking-wide uppercase transition-colors duration-200 ease-fluid hover:bg-foreground hover:text-mint active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
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
              className="border border-line bg-background px-3 py-1.5 text-left font-sans text-[12px] text-subtle max-md:min-h-11 transition-[background-color,border-color,color] duration-200 ease-fluid hover:border-foreground hover:bg-muted/40 hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {isPending && (
          <div className="flex flex-col gap-3 border border-line bg-background p-5 shadow-soft" aria-live="polite">
            <span className="t-eyebrow text-foreground/50">Searching the club&rsquo;s records</span>
            <div className="flex flex-col gap-2">
              {[92, 78, 64].map((width) => (
                <span
                  key={width}
                  className="h-3 animate-pulse bg-muted motion-reduce:animate-none"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          </div>
        )}

        {answers.map((entry, index) => {
          const groups = groupCitations(entry.citations);
          return (
            <article
              key={`${entry.question}-${index}`}
              className={cn(
                "flex flex-col border border-line bg-background shadow-soft transition-opacity duration-200 ease-fluid",
                index > 0 && "opacity-70 hover:opacity-100",
              )}
            >
              <header className="flex items-start gap-3 border-b border-line px-5 py-3.5">
                <SparklesIcon className="mt-[3px] size-3.5 shrink-0 text-mint-dark" />
                <h2 className="font-sans text-[14px] font-semibold leading-[1.5] text-foreground">
                  {entry.question}
                </h2>
              </header>

              <div className="px-5 py-4">
                <AskAnswer markdown={entry.answer} citations={entry.citations} />
              </div>

              {groups.length > 0 ? (
                <footer className="flex flex-col gap-2.5 border-t border-line bg-muted/25 px-5 py-3.5">
                  {groups.map(({ kind, items }) => (
                    <div key={kind} className="flex flex-wrap items-center gap-1.5">
                      <span className="t-eyebrow mr-1 w-full text-foreground/50 sm:w-20">
                        {KIND_LABEL[kind]}
                      </span>
                      {items.map((citation) => {
                        const href = CITATION_HREF[citation.kind](citation.id);
                        const chip =
                          "border border-line bg-background px-2.5 py-1 font-sans text-[12px] text-subtle max-md:min-h-9 max-md:inline-flex max-md:items-center";
                        return href ? (
                          <Link
                            key={citation.id}
                            href={href}
                            className={cn(
                              chip,
                              "transition-[border-color,color,box-shadow] duration-200 ease-fluid hover:border-foreground hover:text-foreground hover:shadow-mint-sm",
                            )}
                          >
                            {citation.label}
                          </Link>
                        ) : (
                          <span key={citation.id} className={chip}>
                            {citation.label}
                          </span>
                        );
                      })}
                    </div>
                  ))}
                </footer>
              ) : (
                entry.noRecords && (
                  <footer className="border-t border-line px-5 py-3">
                    <span className="t-eyebrow text-foreground/50">No matching records</span>
                  </footer>
                )
              )}
            </article>
          );
        })}
      </div>

      <span className="font-sans text-[12px] text-foreground/50">
        Answers come only from the club&rsquo;s own records, and only the ones you can see.
      </span>
    </div>
  );
}
