import { describe, it, expect } from "vitest";
import { signInSchema } from "@/lib/validation/signin-schemas";

const base = { email: "ada@cornell.edu", fullName: "Ada Lovelace" };

describe("signInSchema", () => {
  it("normalises the LinkedIn link on the way in", () => {
    const parsed = signInSchema.parse({
      ...base,
      linkedinUrl: "  www.linkedin.com/in/adalovelace/?utm_source=share  ",
    });
    expect(parsed.linkedinUrl).toBe("https://www.linkedin.com/in/adalovelace");
  });

  it("rejects something that is not a LinkedIn profile", () => {
    const result = signInSchema.safeParse({ ...base, linkedinUrl: "https://twitter.com/ada" });
    expect(result.success).toBe(false);
  });

  it("treats an empty field as unanswered rather than invalid", () => {
    // The required-ness lives in the action, which knows what is already on
    // the row. A returning guest's form legitimately sends these blank.
    const parsed = signInSchema.parse({
      ...base,
      linkedinUrl: "",
      affiliation: "",
      background: "",
    });
    expect(parsed.linkedinUrl).toBeNull();
    expect(parsed.affiliation).toBeNull();
    expect(parsed.background).toBeNull();
  });

  it("keeps the affiliation as typed", () => {
    const parsed = signInSchema.parse({ ...base, affiliation: "  CS '27  " });
    expect(parsed.affiliation).toBe("CS '27");
  });
});
