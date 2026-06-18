import { NextRequest, NextResponse } from "next/server";
import { createIdea, listIdeas } from "@/lib/db";
import { isAuthorized } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/ideas — list everything (read is open; it's your own log).
export function GET() {
  return NextResponse.json({ ideas: listIdeas() });
}

// POST /api/ideas — create an idea. Token required (if configured).
// Accepts one idea object, or { ideas: [...] } for a batch.
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const batch = Array.isArray((payload as { ideas?: unknown })?.ideas)
    ? (payload as { ideas: unknown[] }).ideas
    : [payload];

  const created = batch
    .map((entry) => createIdea(entry as Record<string, unknown>))
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (created.length === 0) {
    return NextResponse.json(
      { error: "no valid ideas (each needs a non-empty title)" },
      { status: 400 },
    );
  }

  return NextResponse.json({ created }, { status: 201 });
}
