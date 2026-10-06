import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { signSelfies } from "@/lib/actions/coffeeChats";
import { buildBoard, type ChatCategory, type ChatPerson, type CoffeeChat } from "@/lib/types/coffee-chats";
import { CHAT_STATUS_LABELS } from "@/lib/validation/coffee-chat-schemas";
import { currentTermKey, termFromKey } from "@/lib/utils/terms";
import { BingoBoard } from "@/components/coffee-chats/BingoBoard";
import { ReviewQueue } from "@/components/coffee-chats/ReviewQueue";
import { CategoryManager } from "@/components/coffee-chats/CategoryManager";
import { Sticker } from "@/components/stickers/Sticker";
import { Seal, Sparkle } from "@/components/stickers/shapes";

const CHAT_COLUMNS =
  "id, submitter_id, partner_id, category_id, selfie_url, status, review_note, " +
  "submitted_at, reviewed_at, semester, partner_guest_id, " +
  "submitter:profiles!coffee_chats_submitter_id_fkey(id, full_name, email), " +
  "partner:profiles!coffee_chats_partner_id_fkey(id, full_name, email), " +
  "partner_guest:guests!coffee_chats_partner_guest_id_fkey(id, full_name, email)";

export default async function CoffeeChatsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const semester = currentTermKey();
  const term = termFromKey(semester);
  const isAdmin = session.profile.role === "admin";

  const [{ data: categories }, { data: chats }, { data: members }, { data: claimed }] =
    await Promise.all([
    supabase
      .from("coffee_chat_categories")
      .select("id, name, description, semester, board_position")
      .eq("semester", semester)
      .order("board_position")
      .returns<ChatCategory[]>(),
    // RLS already limits this to approved chats plus the viewer's own (plus
    // everything, for an admin), so there's no status filter here — adding
    // one would just duplicate the policy in a place it can drift from.
    supabase
      .from("coffee_chats")
      .select(CHAT_COLUMNS)
      .eq("semester", semester)
      .order("submitted_at", { ascending: false })
      .returns<CoffeeChat[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("active", true)
      .neq("status", "revoked")
      .neq("id", session.profile.id)
      .order("full_name", { ascending: true, nullsFirst: false })
      .returns<ChatPerson[]>(),
    // Prospective members this person took out of the request pool. They have
    // no profiles row, so this is the only way they can be logged as a partner.
    supabase
      .from("chat_requests")
      .select("guest:guests!chat_requests_guest_id_fkey(id, full_name, email)")
      .eq("claimed_by", session.profile.id)
      .eq("status", "claimed")
      .returns<{ guest: ChatPerson | null }[]>(),
    ]);

  const claimedGuests = (claimed ?? []).flatMap((row) => (row.guest ? [row.guest] : []));

  const allChats = chats ?? [];
  const squares = buildBoard(categories ?? [], allChats, session.profile.id);

  // One signing round trip for every selfie on the page rather than one per
  // tile: createSignedUrls takes the whole list.
  const selfieUrls = await signSelfies(
    Array.from(new Set(allChats.map((chat) => chat.selfie_url))),
  );

  const pending = allChats.filter((chat) => chat.status === "pending");
  const mine = allChats.filter((chat) => chat.submitter_id === session.profile.id);

  return (
    <div className="relative flex flex-col gap-[17px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden"
      >
        <Sticker
          floatVariant="float2"
          floatDuration="16s"
          wrapperClassName="pointer-events-none absolute right-[11%] top-0"
          className="pointer-events-auto opacity-[0.4]"
        >
          <Sparkle size={58} />
        </Sticker>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-[5px]">
          <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            Coffee chats
          </h1>
          <span className="font-sans text-[12.5px] text-body">
            Fill a square by grabbing coffee with someone and logging it.
          </span>
        </div>
        <Sticker floatVariant="none" wrapperClassName="shrink-0">
          <Seal label={term.key} size={40} color={term.color} />
        </Sticker>
      </div>

      <div className="relative z-10 flex flex-col gap-[17px]">
        {isAdmin && <CategoryManager categories={categories ?? []} />}

        <BingoBoard
          squares={squares}
          members={members ?? []}
        claimedGuests={claimedGuests}
          viewerId={session.profile.id}
          selfieUrls={selfieUrls}
        />

        {isAdmin && (
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
              review queue {pending.length > 0 && `· ${pending.length}`}
            </span>
            <ReviewQueue chats={pending} selfieUrls={selfieUrls} />
          </div>
        )}

        {mine.length > 0 && (
          <div className="flex flex-col gap-2.5">
            <span className="font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
              your submissions
            </span>
            <div className="overflow-hidden rounded-[10px] border border-[rgba(0,0,0,0.1)] bg-paper">
              {mine.map((chat, index) => (
                <div
                  key={chat.id}
                  className={`grid grid-cols-[1.4fr_1fr_auto] items-center gap-3 px-[15px] py-3 ${
                    index < mine.length - 1 ? "border-b border-[rgba(0,0,0,0.07)]" : ""
                  }`}
                >
                  <span className="truncate font-sans text-[12.5px] text-ink">
                    {chat.partner?.full_name ?? chat.partner?.email}
                  </span>
                  <span className="truncate font-sans text-[12px] text-body">
                    {categories?.find((category) => category.id === chat.category_id)?.name ??
                      "Uncategorised"}
                  </span>
                  <span className="justify-self-end font-mono text-[9px] tracking-[0.13em] text-faint uppercase">
                    {CHAT_STATUS_LABELS[chat.status]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
