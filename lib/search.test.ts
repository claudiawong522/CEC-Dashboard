import { describe, expect, it } from "vitest";
import { ilikeAny, sanitizeSearchTerm, snippetAround } from "./search";

describe("sanitizeSearchTerm", () => {
  it("strips PostgREST filter syntax so a term cannot add clauses", () => {
    expect(sanitizeSearchTerm("a,role.eq.admin")).toBe("a role.eq.admin");
    expect(sanitizeSearchTerm('or(x)"*%\\')).toBe("or x");
  });

  it("collapses whitespace and trims", () => {
    expect(sanitizeSearchTerm("  demo   day ")).toBe("demo day");
  });

  it("caps length", () => {
    expect(sanitizeSearchTerm("x".repeat(500))).toHaveLength(100);
  });
});

describe("ilikeAny", () => {
  it("joins one ilike clause per column", () => {
    expect(ilikeAny(["name", "email"], "ann")).toBe("name.ilike.%ann%,email.ilike.%ann%");
  });
});

describe("snippetAround", () => {
  const body = `${"intro words ".repeat(20)}the sponsor pitch went well ${"closing words ".repeat(20)}`;

  it("centres on the hit with ellipses on both cut ends", () => {
    const s = snippetAround(body, "SPONSOR", 30);
    expect(s).toContain("sponsor pitch");
    expect(s.startsWith("…")).toBe(true);
    expect(s.endsWith("…")).toBe(true);
  });

  it("returns short text whole", () => {
    expect(snippetAround("short  note", "zzz")).toBe("short note");
  });

  it("falls back to the opening when there is no hit", () => {
    const s = snippetAround(body, "zzz", 20);
    expect(s.startsWith("intro")).toBe(true);
    expect(s.endsWith("…")).toBe(true);
  });

  it("handles empty text", () => {
    expect(snippetAround("", "a")).toBe("");
  });
});
