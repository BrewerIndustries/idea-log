import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { isAuthorized } from "@/lib/auth";
import { isStorageConfigured, newKey, putObject, safeName } from "@/lib/storage";
import type { Attachment } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

// POST /api/attachments — upload one file (multipart/form-data, field "file").
// Token required. Returns the Attachment metadata to attach to an idea; the
// bytes are stored in R2 and served back via GET /api/attachments/<key>.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: "file storage not configured (set R2_* env vars on the server)" },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "no file provided" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `file too large (max ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB)` },
      { status: 413 },
    );
  }

  const name = safeName(file.name);
  const mime = file.type || "application/octet-stream";
  const key = newKey(name);
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    await putObject(key, bytes, mime);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "upload failed" },
      { status: 502 },
    );
  }

  const attachment: Attachment = { id: randomUUID(), name, mime, size: file.size, key };
  return NextResponse.json({ attachment }, { status: 201 });
}
