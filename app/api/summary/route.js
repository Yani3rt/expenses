import { NextResponse } from "next/server";
import { getDashboardData } from "../../../lib/queries.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getDashboardData(), {
    headers: { "Cache-Control": "no-store" },
  });
}
