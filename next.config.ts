import type { NextConfig } from "next";

import { networkInterfaces } from "node:os";

const isDev = process.env.NODE_ENV === "development";

function lanHosts(): string[] {
  const hosts = new Set(["localhost", "127.0.0.1"]);
  if (process.env.DEV_LAN_HOST) hosts.add(process.env.DEV_LAN_HOST);
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) hosts.add(address.address);
    }
  }
  return [...hosts];
}

// The hosted project serves storage from <ref>.supabase.co. The local stack
// serves it from 127.0.0.1:54321, which next/image rejects unless it is listed
// here too, so every uploaded photo renders as "Try again" on a laptop while
// working perfectly in production. Added only in development, so the
// production allow-list stays exactly as narrow as it was.
const localImageHosts = isDev
  ? [
      {
        protocol: "http" as const,
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http" as const,
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
    ]
  : [];

const nextConfig: NextConfig = {
  // Testing the QR flow means opening the dev server from a phone on the same
  // wifi, which is a different origin to localhost. Next blocks cross-origin
  // dev resources by default, and the symptom is baffling: pages render, but
  // every server action silently does nothing, so buttons just look dead.
  //
  // Worked out from the machine's own interfaces rather than hardcoded, because
  // the address changes with the network and a stale entry reproduces exactly
  // the bug this exists to prevent. Development only; never applies to a build.
  allowedDevOrigins: isDev ? lanHosts() : [],
  images: {
    // Next 16 refuses to optimise an image whose host resolves to a private
    // IP, which is a deliberate SSRF guard. The local Supabase stack is
    // exactly that, so allowing the remote pattern above is not enough on its
    // own: without this, uploads still fail with "upstream image ... resolved
    // to private ip". Opened only in development, so production keeps the
    // guard.
    dangerouslyAllowLocalIP: isDev,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      ...localImageHosts,
    ],
  },
};

export default nextConfig;
