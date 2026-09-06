import { NextResponse } from "next/server.js";
import { getWorkspaceData } from "../../../lib/workspace-queries.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request) {
  const params = new URL(request.url).searchParams;
  try {
    const data = getWorkspaceData({
      range: params.get("range") || "1m",
      end: params.get("end") || undefined,
      currency: params.get("currency") || undefined,
      q: params.get("q") || "",
      category: params.get("category") || "all",
      sort: params.get("sort") || "newest",
      offset: params.get("offset") || 0,
      limit: params.get("limit") || 20,
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      error: "Unable to load spending workspace.",
      detail: error instanceof Error ? error.message : "Unknown database error",
    }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
