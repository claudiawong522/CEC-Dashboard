"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Profile } from "@/lib/auth/getSession";
import { BrandMark } from "@/components/app-shell/BrandMark";
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
  const signOutFormRef = useRef<HTMLFormElement>(null);

  const initials = (profile.full_name ?? profile.email)
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-svh bg-canvas">
      <div className="mx-auto flex min-h-svh w-full max-w-[1360px] items-stretch bg-background">
        <aside className="relative flex w-[228px] shrink-0 flex-col justify-between overflow-hidden border-r border-line bg-paper p-3.5">
          <CloudPuff
            size={260}
            className="pointer-events-none absolute -top-16 -left-20 opacity-[0.14] blur-[2px]"
          />

          <div className="relative flex flex-col gap-7">
            <Link href="/calendar" className="flex items-center gap-2.5 px-2">
              <Sticker floatVariant="none" wrapperClassName="shrink-0">
                <BrandMark className="h-[21px] w-6" />
              </Sticker>
              <span className="font-sans text-[16px] leading-[1.15] font-medium tracking-[-0.014em] text-ink">
                CEC
                <br />
                Dashboard
              </span>
            </Link>

            <nav className="flex flex-col gap-px">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex h-[38px] items-center rounded-btn px-3 font-sans text-[13px] transition-colors duration-200 ease-brand",
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

        <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
