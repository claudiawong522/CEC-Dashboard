import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { CONTACT_COLUMNS, type ContactWithOrg } from "@/lib/types/crm";
import { ContactList } from "@/components/crm/ContactList";
import { NewContactDialog } from "@/components/crm/NewContactDialog";
import { Sticker } from "@/components/stickers/Sticker";
import { Bow } from "@/components/stickers/shapes";

export default async function CrmPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Admin-only end to end, the same as External and for the same reason:
  // these are outside people's details, and they never opted into being
  // visible club-wide the way event logistics did.
  if (session.profile.role !== "admin") redirect("/calendar");

  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from("outreach_contacts")
    .select(CONTACT_COLUMNS)
    .order("created_at", { ascending: false })
    .returns<ContactWithOrg[]>();

  return (
    <div className="relative flex flex-col gap-[17px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-28 overflow-hidden"
      >
        <Sticker
          floatVariant="float2"
          floatDuration="17s"
          wrapperClassName="pointer-events-none absolute right-[10%] top-1"
          className="pointer-events-auto opacity-[0.38]"
        >
          <Bow size={58} />
        </Sticker>
      </div>

      <div className="relative z-10 flex items-end justify-between gap-4">
        <div className="flex flex-col gap-[5px]">
          <h1 className="font-sans text-[24px] leading-[1.2] font-medium tracking-[-0.022em] text-ink">
            CRM
          </h1>
          <span className="font-sans text-[12.5px] text-body">
            Everyone we&rsquo;ve reached out to, and what we&rsquo;ve already said to them.
          </span>
        </div>
        <NewContactDialog />
      </div>

      <div className="relative z-10">
        <ContactList contacts={contacts ?? []} />
      </div>
    </div>
  );
}
