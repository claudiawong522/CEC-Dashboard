import { describe, it, expect } from "vitest";
import { normalizeLinkedIn } from "@/lib/utils/linkedin";

describe("normalizeLinkedIn", () => {
  it("accepts the link the LinkedIn app copies, tracking and all", () => {
    expect(normalizeLinkedIn("https://www.linkedin.com/in/adalovelace?utm_source=share")).toBe(
      "https://www.linkedin.com/in/adalovelace",
    );
  });

  it("lands every way of writing the same profile on one string", () => {
    const expected = "https://www.linkedin.com/in/adalovelace";
    for (const typed of [
      "linkedin.com/in/adalovelace",
      "www.linkedin.com/in/adalovelace",
      "http://linkedin.com/in/adalovelace",
      "https://www.linkedin.com/in/adalovelace/",
      "  https://uk.linkedin.com/in/adalovelace  ",
      "adalovelace",
      "@adalovelace",
    ]) {
      expect(normalizeLinkedIn(typed), typed).toBe(expected);
    }
  });

  it("keeps a company page as a company page", () => {
    expect(normalizeLinkedIn("linkedin.com/company/cornell-entrepreneurship")).toBe(
      "https://www.linkedin.com/company/cornell-entrepreneurship",
    );
  });

  it("refuses anything that is not a LinkedIn profile", () => {
    for (const typed of [
      "",
      "   ",
      "not a link",
      "https://twitter.com/adalovelace",
      // The host page, with no profile on the end of it.
      "https://www.linkedin.com",
      "https://www.linkedin.com/feed/",
      // A near miss worth refusing rather than normalising.
      "https://linkedin.com.example.com/in/adalovelace",
    ]) {
      expect(normalizeLinkedIn(typed), typed).toBeNull();
    }
  });
});
