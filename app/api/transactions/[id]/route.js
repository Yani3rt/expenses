import { NextResponse } from "next/server.js";
import { getTransactionDetailData } from "../../../../lib/queries.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!/^\d+$/.test(String(rawId)) || !Number.isSafeInteger(id) || id < 1) {
    return NextResponse.json(
      { error: "Transaction ID must be a positive integer." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const detail = getTransactionDetailData({
    id,
    q: searchParams.get("q") || "",
    period: searchParams.get("period") || "all",
    month: searchParams.get("month") || "all",
    category: searchParams.get("category") || "all",
  });

  if (!detail) {
    return NextResponse.json(
      { error: "Transaction not found." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(detail, {
    headers: { "Cache-Control": "no-store" },
  });
}
