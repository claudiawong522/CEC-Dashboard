// Both AI features degrade rather than break when ANTHROPIC_API_KEY is absent,
// but until this existed they only said so *after* someone typed a question and
// pressed send: the Ask bar answered with an error, and the Agent showed a
// toast on click. The page looked fine and the failure looked like a bug.
//
// Rendered from the server, where the variable actually lives. The key name is
// shown to admins because they are the ones who can fix it; everyone else gets
// told who to ask rather than a variable they cannot set.
export function MissingKeyNotice({
  feature,
  isAdmin,
  stillWorks,
}: {
  feature: string;
  isAdmin: boolean;
  stillWorks?: string;
}) {
  return (
    <div
      role="status"
      className="flex flex-col gap-[5px] rounded-[10px] border border-[rgba(232,184,48,0.45)] bg-amber/[0.09] px-[15px] py-3"
    >
      <span className="t-eyebrow text-foreground">
        missing api key
      </span>
      <p className="max-w-[70ch] font-sans text-[13px] leading-[1.7] text-subtle">
        {/* Explicit space: JSX drops the one that would otherwise sit between
            the expression and the text that follows it on the next line. */}
        {feature}
        {" needs an Anthropic API key and this environment doesn\u2019t have one, so it can\u2019t answer. "}
        {isAdmin ? (
          <>
            Set <code className="font-mono text-[12px] text-foreground">ANTHROPIC_API_KEY</code> in{" "}
            <code className="font-mono text-[12px] text-foreground">.env.local</code> and restart the
            server.
          </>
        ) : (
          <>Ask an admin to add one.</>
        )}
        {stillWorks ? ` ${stillWorks}` : ""}
      </p>
    </div>
  );
}
