import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { getSession } from "@/lib/auth/getSession";
import { getHub, type SectionColor } from "@/lib/nav/hubs";
import { TriangleScatter } from "@/components/decor/shapes";
import { PageHeader } from "@/components/ui/page-header";

// Tailwind needs the full class names in source to generate them.
const BAR: Record<SectionColor, string> = {
  teal: "bg-teal",
  coral: "bg-coral",
  blue: "bg-blue",
  amber: "bg-amber",
};

const SEED: Record<string, number> = { events: 11, people: 23, outreach: 37, knowledge: 53 };

export default async function HubPage({ params }: { params: Promise<{ hub: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { hub: slug } = await params;
  // An unknown slug, or a hub with nothing this person may open, is a 404
  // rather than an empty grid.
  const hub = getHub(slug, session.profile.role);
  if (!hub) notFound();

  return (
    <div className="relative flex flex-col gap-8">
      <TriangleScatter count={5} seed={SEED[hub.slug] ?? 1} opacity={0.2} />

      <PageHeader className="relative z-10" title={hub.label}>
        {hub.description}
      </PageHeader>

      <ul className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {hub.links.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.href} className="flex">
              <Link
                href={link.href}
                className="group relative flex w-full sm:min-h-[148px] flex-col gap-3 border border-line bg-background p-5 pt-6 shadow-soft transition-[box-shadow,transform,border-color] duration-300 ease-fluid hover:-translate-y-1 hover:border-foreground hover:shadow-mint motion-reduce:hover:translate-y-0"
              >
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-[3px] ${BAR[hub.color]}`} />
                <span className="flex items-center justify-between gap-3">
                  <Icon className="size-5 shrink-0 text-foreground" />
                  <ArrowRightIcon className="size-4 shrink-0 text-foreground/40 transition-[color,transform] duration-200 ease-fluid group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:group-hover:translate-x-0" />
                </span>
                <span className="t-display text-[20px] text-foreground">{link.label}</span>
                <span className="font-sans text-[14px] leading-[1.5] text-subtle">
                  {link.description}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
