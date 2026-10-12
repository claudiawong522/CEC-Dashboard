import { describe, expect, it } from "vitest";
import { getHub, isNavActive, navFor } from "@/lib/nav/hubs";

function activeLabel(role: "admin" | "edit", pathname: string) {
  return navFor(role)
    .filter((entry) => isNavActive(entry, pathname))
    .map((entry) => entry.label);
}

describe("sidebar nav", () => {
  it("lists the big rows for an admin and a member", () => {
    expect(navFor("admin").map((e) => e.label)).toEqual([
      "Calendar",
      "Todo",
      "Gallery",
      "Events",
      "Members",
      "Coffee Chats",
      "Shoutouts",
      "Leaderboard",
      "Notes",
      "Brain",
      "Ask",
      "Outreach",
      "Admin",
    ]);
    expect(navFor("edit").map((e) => e.label)).toEqual([
      "Calendar",
      "Todo",
      "Gallery",
      "Events",
      "Members",
      "Coffee Chats",
      "Shoutouts",
      "Leaderboard",
      "Notes",
      "Brain",
      "Ask",
    ]);
  });

  it("lights the hub on the hub page and on any page under it", () => {
    expect(activeLabel("admin", "/hub/outreach")).toEqual(["Outreach"]);
    expect(activeLabel("admin", "/crm/123")).toEqual(["Outreach"]);
    expect(activeLabel("edit", "/signins")).toEqual(["Events"]);
    expect(activeLabel("edit", "/events/abc")).toEqual(["Calendar"]);
    expect(activeLabel("edit", "/brainstorm")).toEqual([]);
  });

  it("hides admin-only destinations and hubs from members", () => {
    expect(getHub("outreach", "edit")).toBeUndefined();
    expect(getHub("outreach", "admin")?.links.map((l) => l.href)).toContain(
      "/interviews",
    );
    expect(getHub("nope", "admin")).toBeUndefined();
  });
});
