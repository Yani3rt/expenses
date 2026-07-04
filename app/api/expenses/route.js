import { NextResponse } from "next/server";
import { getTransactionsData } from "../../../lib/queries.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request) {
  const params = request.nextUrl.searchParams;
  const data = getTransactionsData({
    q: params.get("q") || "",
    period: params.get("period") || "all",
    month: params.get("month") || "all",
    category: params.get("category") || "all",
  });
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
