import { describe, expect, it } from "vitest";
import { contactNameForIdea, crmContactId } from "./external";

describe("crmContactId", () => {
  it("is null for a lead with no people, which is what quick-add now makes", () => {
    expect(crmContactId([])).toBeNull();
    expect(crmContactId(null)).toBeNull();
    expect(crmContactId(undefined)).toBeNull();
  });

  it("points at the first linked contact", () => {
    expect(crmContactId([{ contact_id: "a" }, { contact_id: "b" }])).toBe("a");
  });
});

describe("contactNameForIdea", () => {
  it("uses the lead's name, trimmed", () => {
    expect(contactNameForIdea("  Ada Lovelace ")).toBe("Ada Lovelace");
  });

  it("never makes a nameless contact", () => {
    expect(contactNameForIdea("   ")).toBe("Untitled lead");
  });
});
