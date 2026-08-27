import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/signout"];

// Belt-and-suspenders alongside config.matcher below: static asset
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

  // getClaims(), not getUser(). getUser() is a network round-trip to the
  // Supabase Auth server on *every* request this proxy sees — and that is
  // every navigation, every RSC payload fetch, and every <Link> prefetch the
  // sidebar fires on hover, so one page view could touch the auth API a
  // dozen times before the page even settled. getClaims() verifies the
  // access token's signature locally against the project's ES256 JWKS
  // (fetched once and cached process-wide), so the check costs microseconds.
  //
  // It still calls getSession() underneath, which is what refreshes an
  // expired token and writes the new cookies through setAll above — this
  // proxy is the only place that refresh can be persisted, because
  // lib/supabase/server.ts has to swallow cookie writes from Server
  // Components. So the refresh behaviour is unchanged.
  //
  // A locally-verified token says "this signature is genuinely ours", not
  // "this account is still allowed in". That second question is answered by
  // lib/auth/getSession.ts, which checks profiles.status on every page and
  // every server action. This gate is only the optimistic first pass, which
  // is exactly what Next's docs say a proxy should be.
  const { data: claims } = await supabase.auth.getClaims();
  const user = claims?.claims ?? null;

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
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

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and the favicon, so the
     * Supabase session cookie stays fresh on every navigation.
     *
     * The export has to be named `config` — Next reads that exact name out
     * of the file at build time. It was `proxyConfig` before, which Next
     * silently ignored, so this matcher never applied and the proxy ran on
     * every single request.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
