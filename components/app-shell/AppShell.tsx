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
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-stone-200">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <BrandMark className="size-5" />
            <span className="text-sm font-medium tracking-tight">
              CEC Dashboard
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="flex flex-col">
                <span className="font-medium">
                  {profile.full_name ?? profile.email}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {profile.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOutFormRef.current?.requestSubmit()}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <form
            ref={signOutFormRef}
            action="/auth/signout"
            method="post"
            className="hidden"
          />
        </div>

        <nav className="flex gap-1 px-6">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative px-3 py-2 text-sm transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {active && (
                  <span
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #E8583D, #E0B94A, #3FA789, #3B6FC2)",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
