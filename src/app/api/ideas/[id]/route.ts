import { NextRequest, NextResponse } from "next/server";
import { deleteIdea, updateIdea } from "@/lib/db";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/ideas/:id — update any field (partial).
export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;

  let patch: Record<string, unknown>;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const updated = updateIdea(id, patch);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ idea: updated });
}

// DELETE /api/ideas/:id
export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const removed = deleteIdea(id);
  return removed > 0
    ? NextResponse.json({ ok: true, removed })
    : NextResponse.json({ error: "not found" }, { status: 404 });
}
