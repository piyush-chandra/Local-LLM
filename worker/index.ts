export interface Env {
  ASSETS: Fetcher;
}

const UPSTREAM = "https://ai.piyush.top/v1/chat/completions";

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const u = new URL(req.url);
    if (u.pathname === "/api/health" && req.method === "GET") {
      return Response.json({ ok: true });
    }
    if (u.pathname === "/api/chat" && req.method === "POST") {
      const body = await req.json();
      const upstreamRes = await fetch(UPSTREAM, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!upstreamRes.ok) {
        return Response.json(
          { error: `Upstream error: ${upstreamRes.status} ${upstreamRes.statusText}` },
          { status: upstreamRes.status }
        );
      }
      return new Response(upstreamRes.body, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    }
    return env.ASSETS.fetch(req);
  },
};
