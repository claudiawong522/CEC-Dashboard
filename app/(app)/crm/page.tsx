import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import { CONTACT_COLUMNS, type ContactWithOrg } from "@/lib/types/crm";
import { ContactList } from "@/components/crm/ContactList";
import { NewContactDialog } from "@/components/crm/NewContactDialog";
import { PageHeader } from "@/components/ui/page-header";
import { TriangleScatter } from "@/components/decor/shapes";

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
    <div className="relative flex flex-col gap-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-40">
        <TriangleScatter count={4} seed={34} opacity={0.2} />
      </div>

      <div className="relative z-10">
        <PageHeader title="CRM" actions={<NewContactDialog />}>
          Everyone we&rsquo;ve reached out to, and what we&rsquo;ve already said to them.
        </PageHeader>
      </div>

      <div className="relative z-10">
        <ContactList contacts={contacts ?? []} />
      </div>
    </div>
  );
}
