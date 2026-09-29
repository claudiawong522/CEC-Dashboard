// Turning whatever somebody typed into the profile URL we actually want.
//
// The field is required now, which makes this the difference between a column
// full of profiles and a column full of "linkedin.com/in/me?utm_source=share",
// "@adalovelace" and "www.linkedin.com/in/ada/". All three are the same
// person, and all three are what a phone keyboard produces at a door.
//
// Pure and shared on purpose: the form uses it to tell somebody their link
// looks wrong before they submit, and the action uses it again because the
// browser's opinion about that is not binding.

/** The normalised profile URL, or null if this is not a LinkedIn profile. */
export function normalizeLinkedIn(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // A bare handle, which is what someone types when they are reading it off
  // their own profile rather than pasting a link. No dots and no slashes, so
  // this can never swallow a URL and mangle it into a handle.
  const handle = trimmed.replace(/^@/, "");
  if (/^[\w\-%À-ÿ]{3,100}$/.test(handle)) {
    return `https://www.linkedin.com/in/${handle}`;
  }

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return null;

  // Everything after the slug is tracking: `?utm_source=share` is on every
  // link the LinkedIn app copies, and two people sharing the same profile
  // should not produce two different strings.
  const match = url.pathname.match(/^\/(in|pub|company|school)\/([^/]+)/i);
  if (!match) return null;

  return `https://www.linkedin.com/${match[1].toLowerCase()}/${match[2]}`;
}
