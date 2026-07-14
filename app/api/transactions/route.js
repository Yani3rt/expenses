import { NextResponse } from "next/server";
import { getTransactionsData } from "../../../lib/queries.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const data = getTransactionsData({
    q: searchParams.get("q") || "",
    period: searchParams.get("period") || "all",
    month: searchParams.get("month") || "all",
    categories: searchParams.getAll("category"),
    sort: searchParams.get("sort") || "newest",
    offset: searchParams.get("offset") || 0,
    limit: searchParams.get("limit") || 50,
  });

  return NextResponse.json({
    transactions: data.transactions,
    meta: data.meta,
    summary: data.summary,
  });
}
