"use client";

import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Citation } from "@/lib/ask/tools";

// Citations link back to the record they came from, so an answer is checkable
// rather than something to take on faith.
export const CITATION_HREF: Record<Citation["kind"], (id: string) => string | null> = {
  member: (id) => `/members/${id}`,
  note: (id) => `/brain/${id}`,
  contact: (id) => `/crm/${id}`,
  event: (id) => `/events/${id}`,
  interaction: () => null,
  shoutout: () => null,
};

function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  return "";
}

/**
 * Renders the model's markdown answer. Raw HTML in the answer is never
 * rendered (react-markdown escapes it by default), which matters because the
 * answer is built from records members wrote.
 *
 * A bolded name that matches a citation becomes a link to that record, so
 * "**Michael Beck**" in a list is one click from his profile.
 */
export function AskAnswer({ markdown, citations }: { markdown: string; citations: Citation[] }) {
  const linkFor = new Map<string, string>();
  for (const citation of citations) {
    const href = CITATION_HREF[citation.kind](citation.id);
    if (href) linkFor.set(citation.label.trim().toLowerCase(), href);
  }

  const components: Components = {
    p: ({ children }) => (
      <p className="font-sans text-[14px] leading-[1.7] text-subtle [&:not(:first-child)]:mt-3">
        {children}
      </p>
    ),
    strong: ({ children }) => {
      const href = linkFor.get(textOf(children).trim().toLowerCase());
      const className = "font-semibold text-foreground";
      return href ? (
        <Link
          href={href}
          className={`${className} underline decoration-mint decoration-2 underline-offset-[3px] transition-colors duration-200 ease-fluid hover:decoration-foreground`}
        >
          {children}
        </Link>
      ) : (
        <strong className={className}>{children}</strong>
      );
    },
    em: ({ children }) => <em className="not-italic text-foreground">{children}</em>,
    ul: ({ children }) => (
      <ul className="mt-3 flex flex-col border-t border-line first:mt-0">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="mt-3 flex list-none flex-col border-t border-line first:mt-0 [counter-reset:ask]">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="flex gap-3 border-b border-line py-2.5 font-sans text-[14px] leading-[1.6] text-subtle before:mt-[9px] before:size-1.5 before:shrink-0 before:bg-mint before:content-[''] [ol>&]:before:mt-0 [ol>&]:before:size-auto [ol>&]:before:bg-transparent [ol>&]:before:font-display [ol>&]:before:text-[12px] [ol>&]:before:font-bold [ol>&]:before:text-foreground/40 [ol>&]:before:[counter-increment:ask] [ol>&]:before:content-[counter(ask,decimal-leading-zero)]">
        <span className="min-w-0 flex-1">{children}</span>
      </li>
    ),
    h1: ({ children }) => <h3 className="t-eyebrow mt-4 mb-1 text-foreground first:mt-0">{children}</h3>,
    h2: ({ children }) => <h3 className="t-eyebrow mt-4 mb-1 text-foreground first:mt-0">{children}</h3>,
    h3: ({ children }) => <h3 className="t-eyebrow mt-4 mb-1 text-foreground first:mt-0">{children}</h3>,
    a: ({ href, children }) => {
      const internal = href?.startsWith("/");
      return internal ? (
        <Link href={href!} className="text-foreground underline decoration-mint decoration-2 underline-offset-[3px]">
          {children}
        </Link>
      ) : (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline decoration-mint decoration-2 underline-offset-[3px]"
        >
          {children}
        </a>
      );
    },
    table: ({ children }) => (
      <div className="mt-3 overflow-x-auto first:mt-0">
        <table className="w-full border-collapse font-sans text-[13px]">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="t-eyebrow border-b-2 border-foreground px-2 py-2 text-left text-foreground/60">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-line px-2 py-2 align-top text-subtle">{children}</td>
    ),
    code: ({ children }) => (
      <code className="bg-muted/60 px-1 py-0.5 font-mono text-[12.5px] text-foreground">{children}</code>
    ),
    hr: () => <hr className="my-4 border-line" />,
  };

  return (
    <div className="min-w-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
