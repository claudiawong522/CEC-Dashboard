"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/lib/auth/getSession";
import { BrandMark } from "@/components/app-shell/BrandMark";
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
  const signOutFormRef = useRef<HTMLFormElement>(null);

  const initials = (profile.full_name ?? profile.email)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header>
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-[26px] pt-5">
          <div className="flex items-center gap-3">
            <BrandMark className="h-[26px] w-[30px]" />
            <span className="font-sans text-[19px] font-medium tracking-[-0.018em] text-ink">
              CEC Dashboard
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full outline-none">
              <Avatar className="size-9">
                <AvatarFallback className="bg-wash text-[12.5px] font-medium text-strong transition-colors duration-200 hover:bg-line-strong">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-[212px] rounded-card border-line bg-paper p-3.5 shadow-menu ring-0"
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
          <form
            ref={signOutFormRef}
            action="/auth/signout"
            method="post"
            className="hidden"
          />
        </div>

        <nav className="mx-auto flex w-full max-w-[1400px] gap-2 px-[26px] pt-4">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 pt-2 pb-3 font-sans text-[14.5px] transition-colors duration-200 ease-brand",
                  active
                    ? "font-medium text-ink"
                    : "font-normal text-faint hover:text-ink",
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 bottom-[5px] h-0.5 rounded-full bg-cent" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="h-px bg-line" />
      </header>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-[26px] py-8">{children}</main>
    </div>
  );
}
