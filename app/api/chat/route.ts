import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const upstreamRes = await fetch("https://ai.piyush.top/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!upstreamRes.ok) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstreamRes.status} ${upstreamRes.statusText}` }),
      { status: upstreamRes.status, headers: { "Content-Type": "application/json" } }
    );
  }

  // Stream the response directly back to the browser
  return new Response(upstreamRes.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
