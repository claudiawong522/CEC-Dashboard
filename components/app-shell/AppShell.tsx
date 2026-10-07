"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  SearchIcon,
  CalendarDaysIcon,
  CheckSquareIcon,
  ArchiveIcon,
  ImageIcon,
  NotebookPenIcon,
  UsersIcon,
  UsersRoundIcon,
  CoffeeIcon,
  MegaphoneIcon,
  ClipboardCheckIcon,
  DoorOpenIcon,
  ContactIcon,
  BrainIcon,
  SparklesIcon,
  MessagesSquareIcon,
  UserRoundCheckIcon,
  BotIcon,
  ShieldCheckIcon,
  TrophyIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Profile } from "@/lib/auth/getSession";
import { COFFEE_CHAT_SIGNUP_ENABLED } from "@/lib/features";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { IntroPlane } from "@/components/app-shell/IntroPlane";
import { Sticker } from "@/components/decor/Sticker";
import { TriRow } from "@/components/decor/shapes";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Grouped rather than one flat list. An admin sees eighteen destinations, and
// undifferentiated they read as eighteen unrelated things: Notes and Brain sat
// between Gallery and Members, CRM and External were separated by Agent. The
// headings are the cheapest way to say what belongs with what.
type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { heading: string; items: NavItem[] };

const EVENT_ITEMS: NavItem[] = [
  { href: "/calendar", label: "Calendar", icon: CalendarDaysIcon },
  { href: "/todo", label: "Todo", icon: CheckSquareIcon },
  { href: "/past-events", label: "Past Events", icon: ArchiveIcon },
  { href: "/photos", label: "Gallery", icon: ImageIcon },
];

const PEOPLE_ITEMS: NavItem[] = [
  { href: "/members", label: "Members", icon: UsersRoundIcon },
  { href: "/coffee-chats", label: "Coffee Chats", icon: CoffeeIcon },
  { href: "/shoutouts", label: "Shoutouts", icon: MegaphoneIcon },
];

const KNOWLEDGE_ITEMS: NavItem[] = [
  { href: "/notes", label: "Notes", icon: NotebookPenIcon },
  { href: "/brain", label: "Brain", icon: BrainIcon },
  { href: "/ask", label: "Ask", icon: SparklesIcon },
];

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // External is a speaker-outreach pipeline with contact info that never
  // opted into being visible club-wide — admin-only end to end, unlike
  // every other nav destination, so it only appears for that role.
  // Attendance and Sign ins are the same job seen from two sides, so they sit
  // together. Working the door is edit-or-admin work, the same rule /signins
  // enforces server side, so a view-only account gets none of it -- except the
  // leaderboard, which anyone signed in can see, because it is the thing being
  // dangled in front of people who keep turning up. Recruiting only appears
  // when there is something in it.
  const doorItems: NavItem[] =
    profile.role === "view"
      ? [{ href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon }]
      : [
          { href: "/attendance", label: "Attendance", icon: ClipboardCheckIcon },
          { href: "/signins", label: "Sign ins", icon: DoorOpenIcon },
          { href: "/leaderboard", label: "Leaderboard", icon: TrophyIcon },
        ];

  const recruitingItems: NavItem[] = [
    ...(COFFEE_CHAT_SIGNUP_ENABLED
      ? [{ href: "/chat-requests", label: "Chat Requests", icon: MessagesSquareIcon }]
      : []),
    ...(profile.role === "admin"
      ? [{ href: "/interviews", label: "Interviews", icon: UserRoundCheckIcon }]
      : []),
  ];

  // Outreach is admin-only end to end: these hold contact details for people
  // who never agreed to be visible club-wide.
  const outreachItems: NavItem[] =
    profile.role === "admin"
      ? [
          { href: "/crm", label: "CRM", icon: ContactIcon },
          { href: "/external", label: "External", icon: UsersIcon },
          { href: "/agent", label: "Agent", icon: BotIcon },
        ]
      : [];

  const navGroups: NavGroup[] = [
    { heading: "Events", items: EVENT_ITEMS },
    { heading: "People", items: [...PEOPLE_ITEMS, ...doorItems] },
    { heading: "Recruiting", items: recruitingItems },
    { heading: "Outreach", items: outreachItems },
    { heading: "Knowledge", items: KNOWLEDGE_ITEMS },
    { heading: "Settings", items: [{ href: "/admin", label: "Admin", icon: ShieldCheckIcon }] },
  ].filter((group) => group.items.length > 0);

  const router = useRouter();
  const signOutFormRef = useRef<HTMLFormElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  const initials = (profile.full_name ?? profile.email)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-svh items-stretch overflow-hidden bg-background">
      <IntroPlane />

      {/* The site's nav, turned on its side: white, a hairline edge, display
          type for the wordmark and group heads, and a mint underline on the
          active destination. */}
      <aside className="relative flex w-[68px] shrink-0 flex-col justify-between border-r border-line bg-background px-3 py-5 transition-[width] duration-200 ease-fluid md:w-[264px] md:px-5">
        <div className="relative flex min-h-0 flex-1 flex-col gap-7">
          <Link href="/calendar" className="flex items-center justify-center gap-3 md:justify-start">
            <Sticker floatVariant="none" wrapperClassName="shrink-0">
              <BrandMark className="h-[24px] w-[26px]" />
            </Sticker>
            <span className="hidden font-display text-[13px] leading-[1.15] font-bold tracking-tight text-foreground uppercase md:inline">
              Cornell
              <br />
              Entrepreneurship Club
            </span>
          </Link>

          <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-foreground/40" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events"
              className="w-full border border-line bg-background py-2 pr-2.5 pl-8 font-sans text-[13px] text-foreground placeholder:text-foreground/40 outline-none transition-[border-color] duration-200 ease-fluid hover:border-foreground/40 focus-visible:border-foreground"
            />
          </form>

          {/* The nav is the part that scrolls, so the brand, the search and the
              account row below stay put. min-h-0 lets this column shrink under
              its content; without it the last groups fall off a laptop screen. */}
          <nav className="-mr-2 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-2 [scrollbar-color:rgba(0,0,0,0.25)_transparent] [scrollbar-width:thin]">
            {navGroups.map((group) => (
              <div key={group.heading} className="flex flex-col gap-0.5">
                {/* Hidden on the icon-only rail, where a heading would be a
                    truncated word above a column of glyphs. */}
                <span className="t-eyebrow hidden pb-2 text-foreground/40 md:block">
                  {group.heading}
                </span>
                {group.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={item.label}
                      className={cn(
                        "group/nav relative flex h-9 items-center justify-center gap-3 font-sans text-[14px] transition-colors duration-200 ease-fluid md:justify-start",
                        active
                          ? "font-medium text-foreground"
                          : "text-foreground/55 hover:text-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-[box-shadow] duration-200",
                          active && "shadow-[0_3px_0_0_var(--mint)] md:shadow-none",
                        )}
                      />
                      <span
                        className={cn(
                          "hidden pb-px md:inline",
                          active
                            ? "shadow-[inset_0_-2px_0_0_var(--mint)]"
                            : "link-underline",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="relative flex shrink-0 items-center gap-3 border-t border-line pt-4">
          <Sticker
            floatVariant="none"
            wrapperClassName="hidden shrink-0 md:block"
            className="opacity-70 transition-opacity duration-200 hover:opacity-100"
          >
            <TriRow size={8} gap={4} />
          </Sticker>

          <DropdownMenu>
            <DropdownMenuTrigger className="mx-auto outline-none focus-visible:ring-2 focus-visible:ring-mint md:mx-0 md:ml-auto">
              <Avatar className="size-8">
                <AvatarFallback className="transition-colors duration-200 hover:bg-mint">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              sideOffset={8}
              className="w-[224px] p-3"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col gap-0.5 p-0 normal-case tracking-normal">
                  <span className="font-display text-[13px] font-bold text-foreground">
                    {profile.full_name ?? profile.email}
                  </span>
                  <span className="font-sans text-[12px] font-normal text-foreground/55">
                    {profile.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="-mx-3 my-2.5" />
                {/* The only way into /profile. It is deliberately not a nav
                    destination, because it belongs to the person rather than to
                    the club, but with no link at all people could not find the
                    page that fills in the directory they are asked to fill in. */}
                <DropdownMenuItem
                  className="-mx-1.5 px-1.5 py-1.5 font-sans text-[13px]"
                  onClick={() => router.push("/profile")}
                >
                  Your profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="-mx-1.5 px-1.5 py-1.5 font-sans text-[13px]"
                  onClick={() => signOutFormRef.current?.requestSubmit()}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <form
          ref={signOutFormRef}
          action="/auth/signout"
          method="post"
          className="hidden"
        />
      </aside>

      <main className="relative min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1240px] px-6 py-8 sm:px-10 sm:py-10 lg:px-14">
          {children}
        </div>
      </main>
    </div>
  );
}
