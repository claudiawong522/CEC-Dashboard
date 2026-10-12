import {
  ArchiveIcon,
  BotIcon,
  BrainIcon,
  CalendarDaysIcon,
  CheckSquareIcon,
  ClipboardCheckIcon,
  CoffeeIcon,
  ContactIcon,
  DoorOpenIcon,
  HeartHandshakeIcon,
  ImageIcon,
  LayersIcon,
  LibraryIcon,
  MegaphoneIcon,
  MessagesSquareIcon,
  NotebookPenIcon,
  SendIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TrophyIcon,
  UserRoundCheckIcon,
  UsersIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/auth/getSession";
import { COFFEE_CHAT_SIGNUP_ENABLED } from "@/lib/features";

// The sidebar used to list every destination in small type. It now shows most
// of them as big rows and keeps two hubs (Events, Outreach); each hub is a page of cards to the deeper
// screens. Both the sidebar and the hub pages read this file, so a
// destination cannot appear in one and be missing from the other.

export type HubLink = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type HubSlug = "events" | "people" | "outreach" | "knowledge";

/** Section colour from the logo tiles, drawn as the cards' 3px bar. */
export type SectionColor = "teal" | "coral" | "blue" | "amber";

export type Hub = {
  slug: HubSlug;
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  color: SectionColor;
  links: HubLink[];
};

function hubDefs(role: Role): Hub[] {
  const admin = role === "admin";
  return [
    {
      slug: "events",
      href: "/hub/events",
      label: "Events",
      description: "Everything after the calendar: what happened and who came.",
      icon: LayersIcon,
      color: "blue",
      links: [
        {
          href: "/past-events",
          label: "Past Events",
          description: "Every event that has already happened, newest first.",
          icon: ArchiveIcon,
        },
        {
          href: "/attendance",
          label: "Attendance",
          description: "Who turned up, for the things worth counting.",
          icon: ClipboardCheckIcon,
        },
        {
          href: "/signins",
          label: "Sign ins",
          description: "Who walked in today, from the door QR code.",
          icon: DoorOpenIcon,
        },
      ],
    },
    {
      slug: "people",
      href: "/hub/people",
      label: "Community",
      description:
        "Getting to know each other: coffee chats, shoutouts and the leaderboard.",
      icon: HeartHandshakeIcon,
      color: "teal",
      links: [
        {
          href: "/coffee-chats",
          label: "Coffee Chats",
          description:
            "Fill a square by grabbing coffee with someone and logging it.",
          icon: CoffeeIcon,
        },
        {
          href: "/shoutouts",
          label: "Shoutouts",
          description: "Say thanks to someone who made something work.",
          icon: MegaphoneIcon,
        },
        {
          href: "/leaderboard",
          label: "Leaderboard",
          description: "Startup Hours nights this semester, most first.",
          icon: TrophyIcon,
        },
      ],
    },
    {
      slug: "outreach",
      href: "/hub/outreach",
      label: "Outreach",
      description:
        "People outside the club: speakers, leads, and the people trying to join.",
      icon: SendIcon,
      color: "coral",
      // Outreach is admin-only end to end: these hold contact details for
      // people who never agreed to be visible club-wide. Interviews is
      // admin-only too, and Chat Requests follows its feature switch.
      links: [
        ...(admin
          ? [
              {
                href: "/crm",
                label: "CRM",
                description:
                  "Everyone we have reached out to, and what we already said.",
                icon: ContactIcon,
              },
              {
                href: "/external",
                label: "External",
                description:
                  "Speaker outreach: every lead, no matter the stage.",
                icon: UsersIcon,
              },
              {
                href: "/agent",
                label: "Agent",
                description: "Drafts emails and turns notes into CRM records.",
                icon: BotIcon,
              },
              {
                href: "/interviews",
                label: "Interviews",
                description:
                  "Recruiting interviews: slots, interviewers and decisions.",
                icon: UserRoundCheckIcon,
              },
            ]
          : []),
        ...(COFFEE_CHAT_SIGNUP_ENABLED
          ? [
              {
                href: "/chat-requests",
                label: "Chat Requests",
                description: "Prospective members asking for a coffee chat.",
                icon: MessagesSquareIcon,
              },
            ]
          : []),
      ],
    },
    {
      slug: "knowledge",
      href: "/hub/knowledge",
      label: "Knowledge",
      description:
        "What the club has written down, and a way to ask it questions.",
      icon: LibraryIcon,
      color: "amber",
      links: [
        {
          href: "/notes",
          label: "Notes",
          description: "Shared notes, edited together.",
          icon: NotebookPenIcon,
        },
        {
          href: "/brain",
          label: "Brain",
          description:
            "Retros, notes and everything the club has bothered to write down.",
          icon: BrainIcon,
        },
        {
          href: "/ask",
          label: "Ask",
          description:
            "Questions about members, events, outreach and the Brain.",
          icon: SparklesIcon,
        },
      ],
    },
  ];
}

/** Hubs this role can see, each holding only the links it can open. Empty hubs drop out. */
export function hubsFor(role: Role): Hub[] {
  return hubDefs(role).filter((hub) => hub.links.length > 0);
}

export function getHub(slug: string, role: Role): Hub | undefined {
  return hubsFor(role).find((hub) => hub.slug === slug);
}

export type NavEntry = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Path prefixes that light this entry up besides its own href. */
  match: string[];
  /** Entries sharing a group sit together; the sidebar draws a rule between groups. */
  group: "daily" | "events" | "people" | "knowledge" | "manage";
  /** Set on hub rows: how many pages the hub opens onto. */
  count?: number;
};

/**
 * The sidebar, top to bottom. Most destinations are their own row again (the
 * rows are big enough to read at a glance); only Events (past events, check-ins)
 * and Outreach (admin-only) stay as hubs, because their pages are opened rarely
 * and belong together.
 */
export function navFor(role: Role): NavEntry[] {
  const hub = (slug: HubSlug): NavEntry[] => {
    const found = getHub(slug, role);
    if (!found) return [];
    return [
      {
        href: found.href,
        label: found.label,
        icon: found.icon,
        match: found.links.map((link) => link.href),
        group: slug === "events" ? "events" : "manage",
        count: found.links.length,
      },
    ];
  };
  return [
    // Event detail and the new-event flow are reached from the calendar.
    {
      href: "/calendar",
      label: "Calendar",
      icon: CalendarDaysIcon,
      match: ["/events"],
      group: "daily",
    },
    {
      href: "/todo",
      label: "Todo",
      icon: CheckSquareIcon,
      match: [],
      group: "daily",
    },
    {
      href: "/photos",
      label: "Gallery",
      icon: ImageIcon,
      match: [],
      group: "events",
    },
    ...hub("events"),
    {
      href: "/members",
      label: "Members",
      icon: UsersIcon,
      match: ["/profile"],
      group: "people",
    },
    {
      href: "/coffee-chats",
      label: "Coffee Chats",
      icon: CoffeeIcon,
      match: [],
      group: "people",
    },
    {
      href: "/shoutouts",
      label: "Shoutouts",
      icon: MegaphoneIcon,
      match: [],
      group: "people",
    },
    {
      href: "/leaderboard",
      label: "Leaderboard",
      icon: TrophyIcon,
      match: [],
      group: "people",
    },
    {
      href: "/notes",
      label: "Notes",
      icon: NotebookPenIcon,
      match: [],
      group: "knowledge",
    },
    {
      href: "/brain",
      label: "Brain",
      icon: BrainIcon,
      match: [],
      group: "knowledge",
    },
    {
      href: "/ask",
      label: "Ask",
      icon: SparklesIcon,
      match: [],
      group: "knowledge",
    },
    ...hub("outreach"),
    ...(role === "admin"
      ? [
          {
            href: "/admin",
            label: "Admin",
            icon: ShieldCheckIcon,
            match: [],
            group: "manage" as const,
          },
        ]
      : []),
  ];
}

export function isUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isNavActive(entry: NavEntry, pathname: string) {
  return [entry.href, ...entry.match].some((prefix) =>
    isUnder(pathname, prefix),
  );
}
