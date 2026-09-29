import { describe, it, expect } from "vitest";
import {
  submitChatSchema,
  reviewChatSchema,
  categorySchema,
  selfieRejectionReason,
  MAX_SELFIE_BYTES,
} from "@/lib/validation/coffee-chat-schemas";

const MEMBER = "11111111-1111-4111-8111-111111111111";
const GUEST = "22222222-2222-4222-8222-222222222222";

const submission = (overrides: Record<string, unknown> = {}) => ({
  partnerId: MEMBER,
  partnerGuestId: null,
  categoryId: "33333333-3333-4333-8333-333333333333",
  storagePath: "chats/selfie.jpg",
  ...overrides,
});

describe("submitChatSchema", () => {
  it("accepts a member partner", () => {
    expect(submitChatSchema.safeParse(submission()).success).toBe(true);
  });

  it("accepts a prospect from the request pool instead", () => {
    const parsed = submitChatSchema.safeParse(
      submission({ partnerId: null, partnerGuestId: GUEST }),
    );
    expect(parsed.success).toBe(true);
  });

  // This mirrors the num_nonnulls check on the table. If the schema let both
  // through, the insert would fail at the database with a constraint name
  // instead of something the person can act on.
  it("refuses both a member and a prospect", () => {
    const parsed = submitChatSchema.safeParse(
      submission({ partnerId: MEMBER, partnerGuestId: GUEST }),
    );
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Pick who you chatted with");
  });

  it("refuses neither", () => {
    const parsed = submitChatSchema.safeParse(
      submission({ partnerId: null, partnerGuestId: null }),
    );
    expect(parsed.success).toBe(false);
  });

  // An uncategorised chat is deliberate: it is logged and shown under past
  // chats, it just does not colour in a tile.
  it("allows a null category", () => {
    expect(submitChatSchema.safeParse(submission({ categoryId: null })).success).toBe(true);
  });

  it("requires a selfie", () => {
    const parsed = submitChatSchema.safeParse(submission({ storagePath: "" }));
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Add a selfie");
  });

  it("refuses a partner id that is not a uuid", () => {
    expect(submitChatSchema.safeParse(submission({ partnerId: "leo" })).success).toBe(false);
  });
});

describe("reviewChatSchema", () => {
  const review = (overrides: Record<string, unknown> = {}) => ({
    chatId: "44444444-4444-4444-8444-444444444444",
    approve: true,
    note: null,
    ...overrides,
  });

  it("accepts an approval with no note", () => {
    expect(reviewChatSchema.safeParse(review()).success).toBe(true);
  });

  it("turns an empty note into null, so the column is not populated with nothing", () => {
    const parsed = reviewChatSchema.safeParse(review({ approve: false, note: "   " }));
    expect(parsed.success).toBe(true);
    expect(parsed.data?.note).toBeNull();
  });

  it("keeps a real note, trimmed", () => {
    const parsed = reviewChatSchema.safeParse(review({ note: "  Wrong person  " }));
    expect(parsed.data?.note).toBe("Wrong person");
  });

  it("refuses a note longer than the column is meant to hold", () => {
    const parsed = reviewChatSchema.safeParse(review({ note: "x".repeat(201) }));
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Keep the note short");
  });
});

describe("categorySchema", () => {
  it("requires a name", () => {
    const parsed = categorySchema.safeParse({ name: "  ", description: null });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0]?.message).toBe("Required");
  });

  it("empties a blank description to null", () => {
    const parsed = categorySchema.safeParse({ name: "A senior", description: "" });
    expect(parsed.data?.description).toBeNull();
  });

  it("refuses a tile label too long to fit on a square", () => {
    const parsed = categorySchema.safeParse({ name: "x".repeat(61), description: null });
    expect(parsed.success).toBe(false);
  });
});

describe("selfieRejectionReason", () => {
  const file = (type: string, size: number) => ({ type, size }) as File;

  it("passes an ordinary phone photo", () => {
    expect(selfieRejectionReason(file("image/jpeg", 2_000_000))).toBeNull();
  });

  it("passes a photo from an iPhone, which is heic", () => {
    expect(selfieRejectionReason(file("image/heic", 3_000_000))).toBeNull();
  });

  it("rejects a video before the upload starts", () => {
    expect(selfieRejectionReason(file("video/mp4", 1_000))).toBe("That needs to be a photo");
  });

  it("rejects a photo over the size cap", () => {
    expect(selfieRejectionReason(file("image/png", MAX_SELFIE_BYTES + 1))).toBe(
      "That photo is over 8MB",
    );
  });

  it("accepts one exactly at the cap", () => {
    expect(selfieRejectionReason(file("image/png", MAX_SELFIE_BYTES))).toBeNull();
  });
});
