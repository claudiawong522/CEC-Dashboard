import { describe, it, expect } from "vitest";
import { rankRequests, sharedInterests } from "@/lib/utils/chat-matching";
import { onlyKnownTags } from "@/lib/utils/interests";

const req = (id: string, interests: string[] | null, created_at: string) => ({
  id,
  interests,
  created_at,
});

describe("onlyKnownTags", () => {
  it("drops free text that predates the vocabulary", () => {
    expect(onlyKnownTags(["hardware", "hardware startups", "Climate"])).toEqual([
      "hardware",
      "climate",
    ]);
  });

  it("deduplicates differently-cased duplicates", () => {
    expect(onlyKnownTags(["AI", "ai", " Ai "])).toEqual(["ai"]);
  });

  it("survives a null array", () => {
    expect(onlyKnownTags(null)).toEqual([]);
  });
});

describe("sharedInterests", () => {
  it("returns only what both sides picked", () => {
    expect(sharedInterests(["hardware", "climate", "design"], ["climate", "hardware"])).toEqual([
      "climate",
      "hardware",
    ]);
  });

  it("is empty when a member has set no interests", () => {
    expect(sharedInterests(null, ["climate"])).toEqual([]);
  });
});

describe("rankRequests", () => {
  it("puts the best overlap first", () => {
    const ranked = rankRequests(
      [
        req("one-tag", ["climate"], "2026-09-01T00:00:00Z"),
        req("two-tags", ["climate", "hardware"], "2026-09-02T00:00:00Z"),
      ],
      ["climate", "hardware"],
    );
    expect(ranked.map((r) => r.request.id)).toEqual(["two-tags", "one-tag"]);
    expect(ranked[0].score).toBe(2);
    expect(ranked[0].shared).toEqual(["climate", "hardware"]);
  });

  it("breaks ties toward whoever has waited longest", () => {
    const ranked = rankRequests(
      [
        req("newer", ["climate"], "2026-09-05T00:00:00Z"),
        req("older", ["climate"], "2026-09-01T00:00:00Z"),
      ],
      ["climate"],
    );
    expect(ranked.map((r) => r.request.id)).toEqual(["older", "newer"]);
  });

  it("still lists a request nobody matches, rather than dropping it", () => {
    const ranked = rankRequests([req("no-overlap", ["gaming"], "2026-09-01T00:00:00Z")], [
      "climate",
    ]);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].score).toBe(0);
  });
});
