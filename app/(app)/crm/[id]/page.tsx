import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import {
  CONTACT_COLUMNS,
  INTERACTION_COLUMNS,
  type ContactWithOrg,
  type Interaction,
  type Organization,
} from "@/lib/types/crm";
import type { ChatPerson } from "@/lib/types/coffee-chats";
import { ContactDetail } from "@/components/crm/ContactDetail";

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.profile.role !== "admin") redirect("/calendar");

  const { id } = await params;
  const supabase = await createClient();

  const { data: contact } = await supabase
    .from("outreach_contacts")
    .select(CONTACT_COLUMNS)
    .eq("id", id)
    .maybeSingle<ContactWithOrg>();

  if (!contact) notFound();

  const [{ data: interactions }, { data: organizations }, { data: admins }] = await Promise.all([
    supabase
      .from("interactions")
      .select(INTERACTION_COLUMNS)
      .eq("contact_id", id)
      .order("occurred_at", { ascending: false })
      .returns<Interaction[]>(),
    supabase
      .from("organizations")
      .select("id, name, domain, type, notes")
      .order("name")
      .returns<Organization[]>(),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .eq("status", "active")
      .order("full_name", { ascending: true, nullsFirst: false })
      .returns<ChatPerson[]>(),
  ]);

  return (
    <ContactDetail
      contact={contact}
      interactions={interactions ?? []}
      organizations={organizations ?? []}
      admins={admins ?? []}
    />
  );
}
