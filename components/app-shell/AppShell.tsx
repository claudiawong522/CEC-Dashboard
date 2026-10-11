"use client";

import { useEffect, useRef, useState } from "react";
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
  MenuIcon,
  XIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Profile } from "@/lib/auth/getSession";
import { COFFEE_CHAT_SIGNUP_ENABLED } from "@/lib/features";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { IntroPlane } from "@/components/app-shell/IntroPlane";
import { Sticker } from "@/components/decor/Sticker";
import { TriRow } from "@/components/decor/shapes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  // Attendance and Sign ins are the same job seen from two sides, so they sit
  // together. Working the door is edit-or-admin work, the same rule /signins
  // enforces server side, so a view-only account gets none of it, except the
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

  // /admin still renders a read-only roster for everyone else, but the nav
  // only promises it to the people who can act on it.
  const settingsItems: NavItem[] =
    profile.role === "admin" ? [{ href: "/admin", label: "Admin", icon: ShieldCheckIcon }] : [];

  const navGroups: NavGroup[] = [
    { heading: "Events", items: EVENT_ITEMS },
    { heading: "People", items: [...PEOPLE_ITEMS, ...doorItems] },
    { heading: "Recruiting", items: recruitingItems },
    { heading: "Outreach", items: outreachItems },
    { heading: "Knowledge", items: KNOWLEDGE_ITEMS },
    { heading: "Settings", items: settingsItems },
  ].filter((group) => group.items.length > 0);

  const router = useRouter();
  const signOutFormRef = useRef<HTMLFormElement>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // The phone drawer remembers the path it was opened on, so any navigation
  // closes it without an effect: once the path moves on, it no longer matches.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  function closeDrawer() {
    setDrawerPath(null);
  }

  useEffect(() => {
    if (drawerOpen) {
      wasOpenRef.current = true;
      closeButtonRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setDrawerPath(null);
      };
      // The page scrolls inside <main>, which goes inert while the drawer is
      // up; the body is pinned too so iOS cannot rubber-band behind it.
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener("keydown", onKey);
      };
    }
    if (wasOpenRef.current) {
      wasOpenRef.current = false;
      menuButtonRef.current?.focus();
    }
  }, [drawerOpen]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      closeDrawer();
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const initials = (profile.full_name ?? profile.email)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const searchForm = (
    <form onSubmit={handleSearchSubmit} className="relative" role="search">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-foreground/40" />
      {/* 16px on phones so iOS does not zoom the page on focus. */}
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search events"
        aria-label="Search events"
        className="h-11 w-full border border-line bg-background pr-2.5 pl-8 font-sans text-[16px] text-foreground placeholder:text-foreground/40 outline-none transition-[border-color] duration-200 ease-fluid hover:border-foreground/40 focus-visible:border-foreground md:h-auto md:py-2 md:text-[13px]"
      />
    </form>
  );

  const lockup = (
    <span className="flex items-center gap-3">
      <Sticker floatVariant="none" wrapperClassName="shrink-0">
        <BrandMark className="h-[24px] w-[26px]" />
      </Sticker>
      <span className="font-display text-[13px] leading-[1.15] font-bold tracking-tight text-foreground uppercase">
        Cornell
        <br />
        Entrepreneurship Club
      </span>
    </span>
  );

  function navList(variant: "drawer" | "sidebar") {
    const drawer = variant === "drawer";
    return navGroups.map((group) => (
      <div key={group.heading} className={cn("flex flex-col", !drawer && "gap-0.5")}>
        <span className={cn("t-eyebrow text-foreground/40", drawer ? "pb-1" : "pb-2")}>
          {group.heading}
        </span>
        {group.items.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={drawer ? closeDrawer : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 font-sans transition-colors duration-200 ease-fluid",
                drawer ? "h-11 text-[15px]" : "h-9 text-[14px]",
                active ? "font-medium text-foreground" : "text-foreground/55 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span
                className={cn(
                  "pb-px",
                  active ? "shadow-[inset_0_-2px_0_0_var(--mint)]" : "link-underline",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    ));
  }

  return (
    <div className="flex h-svh flex-col items-stretch overflow-hidden bg-background md:flex-row">
      <IntroPlane />

      {/* Phone top bar: the mark, a short wordmark and the menu. It sits
          outside <main>, so it stays put while the page scrolls under it. */}
      <header className="relative z-30 flex shrink-0 items-center justify-between border-b border-line bg-background pt-[env(safe-area-inset-top)] pr-[max(16px,env(safe-area-inset-right))] pl-[max(16px,env(safe-area-inset-left))] md:hidden">
        <Link
          href="/calendar"
          aria-label="Cornell Entrepreneurship Club, calendar"
          className="-ml-1 flex h-14 items-center gap-2.5 px-1"
        >
          <BrandMark className="h-[22px] w-6" />
          <span className="t-display text-[18px] tracking-tight text-foreground">CEC</span>
        </Link>
        <Button
          ref={menuButtonRef}
          variant="outline"
          size="icon-lg"
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls="cec-nav-drawer"
          onClick={() => setDrawerPath(pathname)}
        >
          <MenuIcon className="size-5" />
        </Button>
      </header>

      {/* Phone drawer: the same grouped nav, search and account row as the
          sidebar, full height from the left. Visibility waits out the slide
          so the panel animates both ways and is inert while closed. */}
      <div
        id="cec-nav-drawer"
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          drawerOpen ? "visible" : "invisible [transition:visibility_0s_300ms]",
        )}
        inert={!drawerOpen}
      >
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity duration-300 ease-fluid",
            drawerOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={closeDrawer}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(320px,calc(100vw-48px))] flex-col border-r-2 border-foreground bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] transition-transform duration-300 ease-fluid",
            drawerOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2">
            <Link href="/calendar" onClick={closeDrawer} className="flex min-h-11 items-center">
              {lockup}
            </Link>
            <Button
              ref={closeButtonRef}
              variant="outline"
              size="icon-lg"
              aria-label="Close menu"
              onClick={closeDrawer}
            >
              <XIcon className="size-5" />
            </Button>
          </div>

          <div className="shrink-0 px-4 pt-4">{searchForm}</div>

          <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-5">
            {navList("drawer")}
          </nav>

          <div className="shrink-0 border-t border-line p-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-display text-[13px] font-bold text-foreground">
                  {profile.full_name ?? profile.email}
                </span>
                <span className="truncate font-sans text-[12px] text-foreground/55">
                  {profile.email}
                </span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="lg"
                className="px-2"
                onClick={() => {
                  closeDrawer();
                  router.push("/profile");
                }}
              >
                Your profile
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="px-2"
                onClick={() => signOutFormRef.current?.requestSubmit()}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* The site's nav, turned on its side: white, a hairline edge, display
          type for the wordmark and group heads, and a mint underline on the
          active destination. Desktop only; phones get the bar and drawer. */}
      <aside className="relative hidden w-[264px] shrink-0 flex-col justify-between border-r border-line bg-background px-5 py-5 md:flex">
        <div className="relative flex min-h-0 flex-1 flex-col gap-7">
          <Link href="/calendar" className="self-start">
            {lockup}
          </Link>

          {searchForm}

          {/* The nav is the part that scrolls, so the brand, the search and the
              account row below stay put. min-h-0 lets this column shrink under
              its content; without it the last groups fall off a laptop screen. */}
          <nav className="-mr-2 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-2 [scrollbar-color:rgba(0,0,0,0.25)_transparent] [scrollbar-width:thin]">
            {navList("sidebar")}
          </nav>
        </div>

        <div className="relative flex shrink-0 items-center gap-3 border-t border-line pt-4">
          <Sticker
            floatVariant="none"
            wrapperClassName="shrink-0"
            className="opacity-70 transition-opacity duration-200 hover:opacity-100"
          >
            <TriRow size={8} gap={4} />
          </Sticker>

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-auto outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2">
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
      </aside>

      <form ref={signOutFormRef} action="/auth/signout" method="post" className="hidden" />

      <main
        className="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
        inert={drawerOpen}
      >
        <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-[max(32px,env(safe-area-inset-bottom))] sm:px-10 sm:py-10 lg:px-14">
          {children}
        </div>
      </main>
    </div>
  );
}
