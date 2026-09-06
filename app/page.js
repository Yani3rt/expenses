import SpendingWorkspace from "../components/SpendingWorkspace.js";
import { getWorkspaceData } from "../lib/workspace-queries.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_KEYS = ["range", "end", "currency", "q", "category", "sort"];

function sourceIdentity(params) {
  return JSON.stringify(ROUTE_KEYS.map(key => [key, String(params?.[key] || "")]));
}

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const data = getWorkspaceData({
    range: params?.range,
    end: params?.end,
    currency: params?.currency,
    q: params?.q,
    category: params?.category,
    sort: params?.sort,
    offset: 0,
    limit: 20,
  });
  return <SpendingWorkspace data={data} sourceRouteIdentity={sourceIdentity(params)} />;
}
