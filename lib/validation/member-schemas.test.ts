import { describe, expect, it } from "vitest";
import { matchingSchema, profileSchema } from "@/lib/validation/member-schemas";

const validProfile = {
  full_name: "Arsh Singh",
  netid: "as3548",
  pronouns: "",
  major: "Computer Science",
  minor: "",
  college: "Engineering",
  graduation_year: "2027",
  team: "generalist" as const,
  position: "Member",
  hometown: "Bethpage, NY",
  about: "",
  linkedin_url: "",
  portfolio_url: "",
};

describe("profileSchema", () => {
  it("turns cleared optional fields into null rather than empty strings", () => {
    const parsed = profileSchema.parse(validProfile);
    expect(parsed.pronouns).toBeNull();
    expect(parsed.minor).toBeNull();
    expect(parsed.about).toBeNull();
    expect(parsed.linkedin_url).toBeNull();
  });

  it("coerces the graduation year from the string an input hands back", () => {
    expect(profileSchema.parse(validProfile).graduation_year).toBe(2027);
  });

  it("lowercases a netid so it matches the interview approval list", () => {
    const parsed = profileSchema.parse({ ...validProfile, netid: "AS3548" });
    expect(parsed.netid).toBe("as3548");
  });

  it("rejects a netid that isn't letters then digits", () => {
    const result = profileSchema.safeParse({ ...validProfile, netid: "arsh-singh" });
    expect(result.success).toBe(false);
  });

  it("accepts a missing netid, since an invited member hasn't filled one in", () => {
    const parsed = profileSchema.parse({ ...validProfile, netid: "" });
    expect(parsed.netid).toBeNull();
  });

  it("requires a scheme on a link so the browser doesn't read it as relative", () => {
    expect(
      profileSchema.safeParse({ ...validProfile, linkedin_url: "linkedin.com/in/arsh" }).success,
    ).toBe(false);
    expect(
      profileSchema.safeParse({ ...validProfile, linkedin_url: "https://linkedin.com/in/arsh" })
        .success,
    ).toBe(true);
  });

  it("rejects a year outside a plausible range", () => {
    expect(profileSchema.safeParse({ ...validProfile, graduation_year: "27" }).success).toBe(false);
  });
});

describe("matchingSchema", () => {
  it("lowercases and de-duplicates interests so tags match across members", () => {
    const parsed = matchingSchema.parse({
      open_to_chats: true,
      interests: ["Robotics", "robotics", "Hardware"],
      chat_blurb: "Happy to talk hardware.",
    });
    expect(parsed.interests).toEqual(["robotics", "hardware"]);
  });

  it("caps the interest list", () => {
    const result = matchingSchema.safeParse({
      open_to_chats: true,
      interests: Array.from({ length: 13 }, (_, i) => `interest-${i}`),
      chat_blurb: "Hi",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a blurb longer than the field allows", () => {
    const result = matchingSchema.safeParse({
      open_to_chats: true,
      interests: [],
      chat_blurb: "x".repeat(281),
    });
    expect(result.success).toBe(false);
  });

  it("nulls an empty blurb so the action can catch opting in with nothing to say", () => {
    const parsed = matchingSchema.parse({
      open_to_chats: true,
      interests: [],
      chat_blurb: "   ",
    });
    expect(parsed.chat_blurb).toBeNull();
  });
});
