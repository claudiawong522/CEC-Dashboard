"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
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

const NAV_ITEMS = [
  { href: "/calendar", label: "Calendar" },
  { href: "/todo", label: "Todo" },
  { href: "/past-events", label: "Past Events" },
  { href: "/photos", label: "Photos" },
  { href: "/notes", label: "Notes" },
  { href: "/admin", label: "Admin" },
];

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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
      <aside className="relative flex w-[272px] shrink-0 flex-col justify-between overflow-hidden bg-paper p-4">
        <CloudPuff
          size={260}
          className="pointer-events-none absolute -top-16 -left-20 opacity-[0.14] blur-[2px]"
        />

        <div className="relative flex flex-col gap-8">
          <Link href="/calendar" className="flex items-center gap-2.5 px-2">
            <Sticker floatVariant="none" wrapperClassName="shrink-0">
              <BrandMark className="h-[22px] w-6" />
            </Sticker>
            <span className="font-sans text-[17px] font-medium tracking-[-0.014em] text-ink">
              CEC Dashboard
            </span>
          </Link>

          <form onSubmit={handleSearchSubmit} className="relative px-2">
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
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex h-[42px] items-center rounded-btn px-3.5 font-sans text-[14px] transition-colors duration-200 ease-brand",
                    active
                      ? "bg-cent-tint font-medium text-ink"
                      : "font-normal text-faint hover:text-ink",
                  )}
                >
                  {active && (
                    <span className="absolute top-1.5 bottom-1.5 left-0 w-[2.5px] rounded-full bg-cent" />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="relative flex items-center gap-2">
          <Sticker
            floatVariant="none"
            wrapperClassName="shrink-0"
            className="opacity-70 transition-opacity duration-200 hover:opacity-100"
          >
            <BeadRow size={7} gap={5} />
          </Sticker>

          <DropdownMenu>
            <DropdownMenuTrigger className="ml-auto rounded-full outline-none">
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
          background:
            "radial-gradient(ellipse 1100px 760px at 50% 30%, var(--page) 55%, var(--canvas) 100%)",
        }}
      >
        <SidebarSeam />
        <main className="relative z-10 h-full overflow-y-auto">
          <div className="mx-auto w-full max-w-[1120px] py-8 pr-10 pl-[66px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
