import Link from "next/link";

/**
 * One result type on /search: a Space Grotesk label with its count over a
 * hairline, then the rows. Sections with nothing in them are not rendered.
 */
export function SearchSection({
  id,
  label,
  count,
  children,
}: {
  id: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="flex items-baseline gap-2 border-b border-line pb-2">
        <span className="t-eyebrow text-foreground">{label}</span>
        <span className="t-eyebrow text-subtle">{count}</span>
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

/**
 * A linked result card. At least 44px tall, stacked on phones and split
 * left/right from `sm`, with every text line truncating so a long email or
 * note title can never push the page sideways.
 */
export function SearchResultRow({
  href,
  title,
  subtitle,
  meta,
  swatch,
}: {
  href: string;
  title: string;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  swatch?: string;
}) {
  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="flex min-h-11 min-w-0 items-stretch gap-3 border border-line bg-background px-4 py-3 shadow-soft transition-[box-shadow,transform,border-color] duration-300 ease-fluid hover:-translate-y-0.5 hover:border-foreground hover:shadow-mint-sm motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        {swatch && <span aria-hidden="true" className="w-[3px] shrink-0" style={{ background: swatch }} />}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex w-full min-w-0 flex-col gap-0.5 sm:w-auto sm:flex-1">
            <span className="truncate font-sans text-[14px] font-medium text-foreground">{title}</span>
            {subtitle && (
              <span className="line-clamp-2 font-sans text-[12px] break-words text-subtle">
                {subtitle}
              </span>
            )}
          </div>
          {meta && <div className="flex max-w-full shrink-0 flex-wrap items-center gap-2.5">{meta}</div>}
        </div>
      </Link>
    </li>
  );
}
