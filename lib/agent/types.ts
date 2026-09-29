// Shared shapes for the agent's propose-then-confirm flow.
//
// These live outside the "use server" module because that module may only
// export async functions — a type-only export is erased at build time, but
// keeping them here also means the client components can import the shapes
// without pulling the server actions' imports along with them.

export type DraftedEmail = {
  contactId: string;
  contactName: string;
  subject: string;
  body: string;
  // How many timeline entries the draft was grounded in. Zero means it was
  // written as a genuine first approach, and the card says so — a draft that
  // implies shared history where none exists is the failure worth surfacing.
  groundedIn: number;
};

export type CapturedProposal = {
  contact: {
    existingContactId: string | null;
    name: string;
    email: string | null;
    company: string | null;
    title: string | null;
    status: string | null;
    nextFollowUpAt: string | null;
  };
  interaction: {
    kind: string;
    occurredAt: string;
    summary: string;
    body: string | null;
  };
  duplicates: { id: string; name: string; reason: string }[];
};

export type FollowUp = {
  contactId: string;
  name: string;
  company: string | null;
  status: string;
  staleDays: number;
  suggestion: string;
};
