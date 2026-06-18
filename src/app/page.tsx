import type { Metadata } from "next";
import IdeaLog from "@/components/IdeaLog";

export const dynamic = "force-dynamic";

/**
 * Resolve the deployment environment label from JARVIS_ENV (set per-env in the
 * server's .env). Production/MAIN leaves it unset, so this returns null there and
 * no banner renders. Anything else (e.g. "dev") shows the amber non-prod banner.
 *
 * Hardened so the banner can never leak onto production:
 *  1. Hard prod guard — the prod deploy runs on :4660 (its systemd unit sets
 *     PORT=4660). On that port the banner is suppressed unconditionally, even if
 *     JARVIS_ENV were somehow misconfigured. Does NOT depend on prod's .env.
 *  2. Default-safe — absence of JARVIS_ENV (the prod default) => no banner.
 *  3. Explicit prod values (main/prod/production) => no banner.
 */
function resolveEnv(): string | null {
  if (process.env.PORT === "4660") return null; // (1) never on the prod port

  const raw = (process.env.JARVIS_ENV ?? "").trim().toLowerCase();
  if (!raw || raw === "main" || raw === "prod" || raw === "production") return null; // (2)(3)
  return raw.toUpperCase();
}

export function generateMetadata(): Metadata {
  const env = resolveEnv();
  return { title: env ? `[${env}] Idea Log` : "Idea Log" };
}

export default function Home() {
  return <IdeaLog env={resolveEnv()} />;
}
