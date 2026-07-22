import { NextRequest, NextResponse } from "next/server";
import { getObject, isStorageConfigured, keyInThisEnv } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string[] }> };

// GET /api/attachments/<key…> — stream an attachment's bytes back from R2.
// Reads are open (like the rest of the log). The key must live in this env's
// namespace, so this can't be used to fetch arbitrary bucket objects.
export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "file storage not configured" }, { status: 404 });
  }
  const { key: parts } = await ctx.params;
  const key = (parts ?? []).map(decodeURIComponent).join("/");
  if (!keyInThisEnv(key)) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  let obj;
  try {
    obj = await getObject(key);
  } catch {
    return NextResponse.json({ error: "storage error" }, { status: 502 });
  }
  if (!obj) return NextResponse.json({ error: "not found" }, { status: 404 });

  const headers = new Headers({
    "content-type": obj.contentType,
    // Objects are immutable (unique key per upload), so cache hard.
    "cache-control": "private, max-age=31536000, immutable",
  });
  if (obj.contentLength) headers.set("content-length", obj.contentLength);

  return new Response(obj.body, { status: 200, headers });
}
