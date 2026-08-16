"use server";

import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth/getSession";
import { createClient } from "@/lib/supabase/server";
import {
  ASK_DAILY_LIMIT,
  ASK_SYSTEM_PROMPT,
  ASK_TOOLS,
  runAskTool,
  type Citation,
} from "@/lib/ask/tools";
import { currentTermKey } from "@/lib/utils/terms";

export type AskResult =
  | { ok: true; answer: string; citations: Citation[]; toolsUsed: string[]; noRecords: boolean }
  | { ok: false; message: string };

// One retrieve-then-answer round trip, deliberately bounded rather than an
// open-ended agent loop: the model gets one chance to call tools, then has to
// answer from what came back. An ask bar is a question box, and a question box
// that sometimes takes forty seconds is a worse product than one that
// occasionally says it could not find something.
const MAX_TOKENS = 8000;

export async function ask(question: string): Promise<AskResult> {
  const session = await getSession();
  if (!session) throw new Error("Not signed in");

  const trimmed = question.trim();
  if (!trimmed) return { ok: false, message: "Ask something first" };
  if (trimmed.length > 500) return { ok: false, message: "Keep the question under 500 characters" };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[ask] ANTHROPIC_API_KEY is not set");
    return { ok: false, message: "The ask bar isn't configured yet — ask an admin" };
  }

  const supabase = await createClient();

  // Per-person daily cap. Counted from the log rather than a separate counter
  // so it can't drift from what actually happened.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: used } = await supabase
    .from("ask_logs")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", session.profile.id)
    .gte("created_at", since);

  if ((used ?? 0) >= ASK_DAILY_LIMIT) {
    return {
      ok: false,
      message: `That's ${ASK_DAILY_LIMIT} questions in a day. It resets 24 hours after your first one.`,
    };
  }

  const client = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Asked by ${session.profile.full_name ?? session.profile.email} (role: ${
        session.profile.role
      }), semester ${currentTermKey()}.\n\nQuestion: ${trimmed}`,
    },
  ];

  const toolsUsed: string[] = [];
  const citations: Citation[] = [];

  try {
    const first = await client.messages.create({
      model: "claude-opus-5",
      // Thinking is on by default on this model and max_tokens caps thinking
      // plus the answer together, so the budget has to leave room for both
      // even though the answer itself is a few sentences.
      max_tokens: MAX_TOKENS,
      output_config: { effort: "medium" },
      system: ASK_SYSTEM_PROMPT,
      tools: ASK_TOOLS,
      messages,
    });

    let final = first;

    const toolUses = first.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (toolUses.length > 0) {
      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const call of toolUses) {
        toolsUsed.push(call.name);
        const { text, citations: found } = await runAskTool(
          supabase,
          call.name,
          (call.input ?? {}) as Record<string, unknown>,
        );
        citations.push(...found);
        results.push({ type: "tool_result", tool_use_id: call.id, content: text });
      }

      messages.push({ role: "assistant", content: first.content });
      messages.push({ role: "user", content: results });

      // No tools on the second call: the model answers from what it retrieved
      // rather than starting another round.
      final = await client.messages.create({
        model: "claude-opus-5",
        max_tokens: MAX_TOKENS,
        output_config: { effort: "medium" },
        system: ASK_SYSTEM_PROMPT,
        messages,
      });
    }

    // Safety classifiers can decline a request; that arrives as a normal 200
    // with an empty or partial body, so it has to be checked before reading
    // the content rather than after.
    if (final.stop_reason === "refusal") {
      return { ok: false, message: "I can't answer that one. Try rephrasing it." };
    }

    const answer = final.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    const noRecords = citations.length === 0;

    // Every ask is logged: who asked, which tools ran, which records came
    // back. This is the audit trail and the first place to look when
    // retrieval returns something surprising or nothing at all.
    await supabase.from("ask_logs").insert({
      profile_id: session.profile.id,
      question: trimmed,
      tools_used: toolsUsed,
      record_ids: citations.map((citation) => citation.id),
      answered: !noRecords,
    });

    // Cite each record once, in the order the tools returned them.
    const seen = new Set<string>();
    const unique = citations.filter((citation) =>
      seen.has(citation.id) ? false : (seen.add(citation.id), true),
    );

    return { ok: true, answer, citations: unique, toolsUsed, noRecords };
  } catch (error) {
    console.error("[ask] failed:", error);
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, message: "Too many questions at once — try again in a moment" };
    }
    return { ok: false, message: "Couldn't answer that — try again" };
  }
}
