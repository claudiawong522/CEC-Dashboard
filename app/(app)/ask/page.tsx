import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/getSession";
import { AskBar } from "@/components/ask/AskBar";
import { MissingKeyNotice } from "@/components/ui/missing-key-notice";
import { PageHeader } from "@/components/ui/page-header";
import { TriangleScatter } from "@/components/decor/shapes";

export default async function AskPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  // Read here rather than in the client component: the variable is server-only
  // and must never be shipped to the browser, so only the boolean crosses over.
  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  return (
    <div className="relative flex flex-col gap-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -top-3 z-0 h-40">
        <TriangleScatter count={4} seed={32} opacity={0.2} />
      </div>

      <div className="relative z-10">
        <PageHeader title="Ask">
          Questions about members, events, outreach, and anything the club has written down.
        </PageHeader>
      </div>

      {!hasKey && (
        <div className="relative z-10">
          <MissingKeyNotice
            feature="Ask"
            isAdmin={session.profile.role === "admin"}
            stillWorks="Everything else in the dashboard is unaffected."
          />
        </div>
      )}

      <div className="relative z-10">
        <AskBar />
      </div>
    </div>
  );
}
