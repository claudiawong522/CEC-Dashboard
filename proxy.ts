import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = ["/login", "/auth/callback", "/auth/signout"];

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

  const isPublicPath = PUBLIC_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (!user && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/calendar", request.url));
  }

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
