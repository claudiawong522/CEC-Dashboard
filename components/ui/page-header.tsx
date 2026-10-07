import { cn } from "@/lib/utils";
import { MintRule } from "@/components/decor/shapes";

/**
 * Every screen's head, the way cornellec.com heads a section: an optional
 * tracked eyebrow, the title in Space Grotesk 700 uppercase, the mint rule,
 * and whatever actions belong up here on the right. `children` is the
 * one-line description under the rule.
 */
export function PageHeader({
  eyebrow,
  title,
  actions,
  children,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-6 gap-y-4", className)}>
      <div className="flex min-w-0 flex-col gap-3">
        {eyebrow && <span className="t-eyebrow text-foreground/50">{eyebrow}</span>}
        <h1 className="t-display text-[32px] text-foreground sm:text-[36px]">{title}</h1>
        <MintRule className="w-20" />
        {children && (
          <p className="max-w-[60ch] font-sans text-[14px] leading-[1.6] text-subtle">{children}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
