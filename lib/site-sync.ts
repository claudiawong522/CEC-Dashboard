// cornellec.com reads the members_public view with a one-hour cache and a
// "members" tag. A profile save here asks it to drop that tag so the change
// shows within seconds instead of within the hour. Fire and forget: the
// dashboard must never fail a save because the public site is slow or down,
// and with the env unset (local stacks, previews) it does nothing at all.
export function pingSiteRevalidate(): void {
  const url = process.env.SITE_REVALIDATE_URL;
  const secret = process.env.SITE_REVALIDATE_SECRET;
  if (!url || !secret) return;

  fetch(url, {
    method: "POST",
    headers: { "x-revalidate-secret": secret },
    signal: AbortSignal.timeout(5000),
  })
    .then((res) => {
      if (!res.ok) console.warn(`[site-sync] revalidate answered ${res.status}`);
    })
    .catch((err: unknown) => {
      console.warn("[site-sync] revalidate ping failed:", err instanceof Error ? err.message : err);
    });
}
