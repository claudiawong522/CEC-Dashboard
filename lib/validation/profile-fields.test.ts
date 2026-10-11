import { describe, expect, it } from "vitest";
import { parseProfileFields } from "@/lib/validation/member-schemas";

const draft = {
  full_name: "Dev Member",
  netid: "dm123",
  pronouns: "",
  major: "CS",
  minor: "",
  college: "",
  graduation_year: "2027",
  team: null,
  position: "Member",
  hometown: "",
  about: "",
  hobbies: "",
  building: "",
  linkedin_url: "",
  portfolio_url: "",
  github_url: "",
  show_on_site: false,
};

describe("parseProfileFields", () => {
  it("keeps every valid field when one is invalid", () => {
    const { data, errors } = parseProfileFields({ ...draft, netid: "w2dm", full_name: "New Name" });
    expect(errors).toEqual({ netid: "A netid looks like ab123" });
    expect(data.full_name).toBe("New Name");
    expect(data.graduation_year).toBe(2027);
    expect(data).not.toHaveProperty("netid");
  });

  it("reports each invalid field on its own", () => {
    const { errors } = parseProfileFields({ ...draft, graduation_year: "20", github_url: "github.com/x" });
    expect(Object.keys(errors).sort()).toEqual(["github_url", "graduation_year"]);
  });

  it("returns the whole row when everything is valid", () => {
    const { data, errors } = parseProfileFields(draft);
    expect(errors).toEqual({});
    expect(data.netid).toBe("dm123");
    expect(data.pronouns).toBeNull();
  });
});
