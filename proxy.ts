import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Routes that work with no session at all: the walk-in sign in and the
// prospective-member chat form, both by design.
//
// Matched per path segment, not by raw prefix. A plain startsWith would make
// `/chat` here also match `/chat-requests`, which is the members-only pool of
// prospective members and their contact details -- published to the internet by
// a single entry in this list. The same trap applies to `/checkin` and
// `/signins`. Segment matching means a public route opens itself and its own
// children, and nothing that merely starts with the same letters.
// `/chat` is deliberately absent. The coffee chat signup is built and works,
// but recruitment is settled for this semester and nobody is watching the
// request pool. A public form feeding a queue no one reads is worse than no
// form: someone writes in and waits for a reply that never comes. Put it back
// here when recruitment reopens.
const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/signout", "/checkin"];

// Belt-and-suspenders alongside proxyConfig.matcher below: static asset
// requests (CSS/JS chunks, images, fonts) must never hit the auth check —
// if they do, an unauthenticated request gets redirected to /login instead
// of returning the asset, and the whole app renders unstyled.
const ASSET_PATH_PREFIXES = ["/_next/", "/favicon.ico"];
const ASSET_EXTENSIONS = /\.(css|js|map|png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf)$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (ASSET_PATH_PREFIXES.some((p) => pathname.startsWith(p)) || ASSET_EXTENSIONS.test(pathname)) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // No "already logged in, bounce away from /login" redirect here on
  // purpose: an invite-accept link lands on /login with its session token
  // in the URL hash, which never reaches the server, so this request looks
  // identical to a plain already-authenticated visit — a server-side
  // redirect here would fire before the browser ever gets to read the hash
  // and could swap onto the invited account. The login page handles the
  // "already signed in" redirect itself, client-side, after checking.

  return response;
}

export const proxyConfig = {
  matcher: [
    /*
     * Run on everything except static assets and the favicon, so the
     * Supabase session cookie stays fresh on every navigation.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
