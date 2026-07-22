// Object storage for idea attachments — Cloudflare R2 over its S3-compatible API.
//
// The DB only stores attachment metadata (see Attachment in types.ts); the bytes
// live here. Files are uploaded via POST /api/attachments and served back through
// GET /api/attachments/<key> (we proxy rather than expose a public bucket, so no
// custom domain / public-bucket setup is needed — only the four env vars below).
//
// Config (server-only; set in each env's .env):
//   R2_ACCOUNT_ID          Cloudflare account id (the R2 endpoint subdomain)
//   R2_ACCESS_KEY_ID       R2 API token access key
//   R2_SECRET_ACCESS_KEY   R2 API token secret
//   R2_BUCKET              bucket name
// Keys are prefixed per environment (dev/ vs prod/) so DEV uploads never collide
// with prod, even against one shared bucket.

import { AwsClient } from "aws4fetch";
import { randomUUID } from "crypto";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    env("R2_ACCOUNT_ID") &&
      env("R2_ACCESS_KEY_ID") &&
      env("R2_SECRET_ACCESS_KEY") &&
      env("R2_BUCKET"),
  );
}

let cached: { client: AwsClient; base: string } | null = null;

function client(): { client: AwsClient; base: string } {
  if (cached) return cached;
  const accountId = env("R2_ACCOUNT_ID")!;
  const bucket = env("R2_BUCKET")!;
  const aws = new AwsClient({
    accessKeyId: env("R2_ACCESS_KEY_ID")!,
    secretAccessKey: env("R2_SECRET_ACCESS_KEY")!,
    region: "auto",
    service: "s3",
  });
  cached = {
    client: aws,
    base: `https://${accountId}.r2.cloudflarestorage.com/${bucket}`,
  };
  return cached;
}

/** dev/ vs prod/ — keeps the two deployments' objects apart in one bucket. */
export function keyPrefix(): string {
  return env("JARVIS_ENV") === "dev" ? "dev" : "prod";
}

/** URL-encode a slash-delimited key without escaping the slashes. */
function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/");
}

function urlFor(key: string): string {
  return `${client().base}/${encodeKey(key)}`;
}

/** Sanitize a user filename down to a safe, bounded basename. */
export function safeName(name: unknown): string {
  const base = String(name ?? "").split(/[\\/]/).pop() ?? "";
  const cleaned = base.replace(/[^\w.\- ]+/g, "_").replace(/\s+/g, " ").trim();
  return cleaned.slice(0, 120) || "file";
}

/** Fresh object key for a new upload: <env>/<uuid>/<safe filename>. */
export function newKey(name: string): string {
  return `${keyPrefix()}/${randomUUID()}/${safeName(name)}`;
}

/** True if a key belongs to this environment's namespace (defends the GET/DELETE routes). */
export function keyInThisEnv(key: string): boolean {
  return typeof key === "string" && key.startsWith(`${keyPrefix()}/`);
}

export async function putObject(key: string, body: Uint8Array, contentType: string): Promise<void> {
  const { client: aws } = client();
  const res = await aws.fetch(urlFor(key), {
    method: "PUT",
    // aws4fetch hashes typed arrays fine at runtime; the cast sidesteps TS 5.7's
    // generic-Uint8Array vs BodyInit friction.
    body: body as BodyInit,
    headers: { "content-type": contentType || "application/octet-stream" },
  });
  if (!res.ok) {
    throw new Error(`R2 put failed (${res.status}): ${await res.text().catch(() => "")}`);
  }
}

export interface FetchedObject {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: string | null;
}

/** Stream an object back, or null if it doesn't exist. */
export async function getObject(key: string): Promise<FetchedObject | null> {
  const { client: aws } = client();
  const res = await aws.fetch(urlFor(key), { method: "GET" });
  if (res.status === 404) return null;
  if (!res.ok || !res.body) {
    throw new Error(`R2 get failed (${res.status})`);
  }
  return {
    body: res.body,
    contentType: res.headers.get("content-type") ?? "application/octet-stream",
    contentLength: res.headers.get("content-length"),
  };
}

/** Best-effort delete; never throws (orphan cleanup shouldn't break a request). */
export async function deleteObject(key: string): Promise<void> {
  try {
    const { client: aws } = client();
    await aws.fetch(urlFor(key), { method: "DELETE" });
  } catch {
    /* ignore */
  }
}
