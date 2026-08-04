// How a server action reports a failure the person who triggered it can act on.
//
// Next.js replaces the message of anything *thrown* out of a server action with
// a generic "An error occurred in the Server Components render… the specific
// message is omitted in production builds" string, keeping only a digest. So a
// thrown `new Error("This is the only admin left — make someone else an admin
// first")` reads perfectly in `next dev` and reaches the admin in production as
// noise. Anything written for a human comes back as a value instead, which
// survives the boundary untouched.
//
// Throwing is still right for what should never happen — a non-admin reaching
// an admin action, a client that lost its session. Callers catch those and show
// a generic fallback while the real error stays in the server logs.
// A successful action can carry a message too, for the cases where "it
// worked" isn't the whole story — re-inviting someone who was removed puts
// them back without sending a new email, and the admin needs telling.
export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

export function actionOk(message?: string): ActionResult {
  return { ok: true, message };
}

export function actionFailed(message: string): ActionResult {
  return { ok: false, message };
}
