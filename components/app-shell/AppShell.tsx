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
  ContactIcon,
  BrainIcon,
  SparklesIcon,
  MessagesSquareIcon,
  UserRoundCheckIcon,
  BotIcon,
  ShieldCheckIcon,
} from "lucide-react";
import type { Profile } from "@/lib/auth/getSession";
import { BrandMark } from "@/components/app-shell/BrandMark";
import { SidebarSeam } from "@/components/app-shell/SidebarSeam";
import { Sticker } from "@/components/stickers/Sticker";
import { CloudPuff, BeadRow } from "@/components/stickers/shapes";
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

const BASE_NAV_ITEMS = [
  { href: "/calendar", label: "Calendar", icon: CalendarDaysIcon },
  { href: "/todo", label: "Todo", icon: CheckSquareIcon },
  { href: "/past-events", label: "Past Events", icon: ArchiveIcon },
  { href: "/photos", label: "Gallery", icon: ImageIcon },
  { href: "/notes", label: "Notes", icon: NotebookPenIcon },
  { href: "/brain", label: "Brain", icon: BrainIcon },
  { href: "/ask", label: "Ask", icon: SparklesIcon },
  { href: "/members", label: "Members", icon: UsersRoundIcon },
  { href: "/coffee-chats", label: "Coffee Chats", icon: CoffeeIcon },
  { href: "/shoutouts", label: "Shoutouts", icon: MegaphoneIcon },
  { href: "/chat-requests", label: "Chat Requests", icon: MessagesSquareIcon },
];

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isCalendar = pathname === "/calendar" || pathname.startsWith("/calendar/");
  // External is a speaker-outreach pipeline with contact info that never
  // opted into being visible club-wide — admin-only end to end, unlike
  // every other nav destination, so it only appears for that role.
  const navItems =
    profile.role === "admin"
      ? [
          ...BASE_NAV_ITEMS,
          { href: "/attendance", label: "Attendance", icon: ClipboardCheckIcon },
          { href: "/interviews", label: "Interviews", icon: UserRoundCheckIcon },
          { href: "/crm", label: "CRM", icon: ContactIcon },
          { href: "/agent", label: "Agent", icon: BotIcon },
          { href: "/external", label: "External", icon: UsersIcon },
          { href: "/admin", label: "Admin", icon: ShieldCheckIcon },
        ]
      : [
          ...BASE_NAV_ITEMS,
          // Taking attendance is an edit-role action, so a view-only account
          // (alumni, anyone who should read without writing) doesn't get the
          // nav item and the page redirects them away too.
          ...(profile.role === "edit"
            ? [{ href: "/attendance", label: "Attendance", icon: ClipboardCheckIcon }]
            : []),
          { href: "/admin", label: "Admin", icon: ShieldCheckIcon },
        ];
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
    <div className="flex h-svh items-stretch overflow-hidden bg-canvas">
      <aside className="relative flex w-[76px] shrink-0 flex-col justify-between overflow-hidden bg-paper p-4 transition-[width] duration-200 ease-brand md:w-[272px]">
        <CloudPuff
          size={260}
          className="pointer-events-none absolute -top-16 -left-20 opacity-[0.14] blur-[2px]"
        />

        <div className="relative flex flex-col gap-8">
          <Link href="/calendar" className="flex items-center justify-center gap-2.5 px-2 md:justify-start">
            <Sticker floatVariant="none" wrapperClassName="shrink-0">
              <BrandMark className="h-[22px] w-6" />
            </Sticker>
            <span className="hidden font-sans text-[17px] font-medium tracking-[-0.014em] text-ink md:inline">
              CEC Dashboard
            </span>
          </Link>

          <form onSubmit={handleSearchSubmit} className="relative hidden px-2 md:block">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4.5 size-3.5 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events"
              className="w-full rounded-input border border-line-input bg-page py-2 pr-2.5 pl-8 font-sans text-[12.5px] text-ink placeholder:text-faint outline-none transition-[border-color,box-shadow] duration-[220ms] focus-visible:border-strong focus-visible:ring-[3px] focus-visible:ring-[rgba(35,32,28,0.05)]"
            />
          </form>

          <nav className="flex flex-col gap-px">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className={cn(
                    "relative flex h-[42px] items-center justify-center gap-2.5 rounded-btn px-3.5 font-sans text-[14px] transition-colors duration-200 ease-brand md:justify-start",
                    active
                      ? "bg-cent-tint font-medium text-ink"
                      : "font-normal text-faint hover:text-ink",
                  )}
                >
                  {active && (
                    <span className="absolute top-1.5 bottom-1.5 left-0 w-[2.5px] rounded-full bg-cent" />
                  )}
                  <Icon className="size-4 shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative flex items-center gap-2">
          <Sticker
            floatVariant="none"
            wrapperClassName="hidden shrink-0 md:block"
            className="opacity-70 transition-opacity duration-200 hover:opacity-100"
          >
            <BeadRow size={7} gap={5} />
          </Sticker>

          <DropdownMenu>
            <DropdownMenuTrigger className="mx-auto rounded-full outline-none md:mx-0 md:ml-auto">
              <Avatar className="size-8">
                <AvatarFallback className="bg-wash text-[11.5px] font-medium text-strong transition-colors duration-200 hover:bg-line-strong">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              sideOffset={8}
              className="w-[212px] rounded-card border border-line bg-paper p-3.5 shadow-menu ring-0"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col gap-0.5 p-0">
                  <span className="font-sans text-[13px] font-medium text-ink">
                    {profile.full_name ?? profile.email}
                  </span>
                  <span className="font-sans text-[11.5px] font-normal text-faint">
                    {profile.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="-mx-3.5 my-2.5 bg-line" />
                <DropdownMenuItem
                  className="-mx-1.5 rounded-chip px-1.5 py-1.5 font-sans text-[12.5px] text-body focus:bg-wash focus:text-ink"
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

      <div
        className="relative min-w-0 flex-1"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 1100px 760px at 50% 30%, var(--page) 55%, var(--canvas) 100%), url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/></svg>\")",
          backgroundBlendMode: "normal, overlay",
        }}
      >
        <SidebarSeam />
        <main className="relative z-10 h-full overflow-y-auto">
          <div
            className="mx-auto w-full max-w-[1120px] py-8 pr-10 pl-[66px]"
            style={isCalendar ? undefined : { zoom: 1.08 }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
