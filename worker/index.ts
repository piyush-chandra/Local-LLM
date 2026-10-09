export interface Env {
  ASSETS: Fetcher;
}

const UPSTREAM = "https://ai.piyush.top/v1/chat/completions";

const notFound = () =>
  new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
const methodNotAllowed = () =>
  Response.json({ error: "Method not allowed" }, { status: 405 });

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const u = new URL(req.url);
    if (u.pathname === "/api/health") {
      if (req.method === "GET" || req.method === "HEAD") return Response.json({ ok: true });
      return methodNotAllowed();
    }
    if (u.pathname === "/api/chat") {
      if (req.method !== "POST") return methodNotAllowed();
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
    if (u.pathname.startsWith("/api/")) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    try {
      const res = await env.ASSETS.fetch(req);
      if (res.status === 404) return notFound();
      return res;
    } catch {
      return notFound();
    }
  },
};
