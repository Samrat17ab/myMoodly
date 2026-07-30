/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { ChatRoom, Matchmaker, type RealtimeEnv } from "./realtime";
import { authenticatedRequestEmail } from "./access-auth";

interface Env extends RealtimeEnv {
  ASSETS: Fetcher;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/match") {
      const payload = request.method === "POST"
        ? await request.clone().json() as Record<string, unknown>
        : {};
      const email = await authenticatedRequestEmail(request, env, payload.email);
      if (!email) return Response.json({ error: "Authentication required" }, { status: 401 });
      const forwardedHeaders = new Headers(request.headers);
      forwardedHeaders.set("x-moodly-user-email", email);
      const matchmaker = env.MATCHMAKER.getByName("moodly-global-matchmaker");
      return matchmaker.fetch(new Request(request, { headers: forwardedHeaders }));
    }

    if (url.pathname === "/api/realtime") {
      const email = await authenticatedRequestEmail(
        request,
        env,
        url.searchParams.get("email"),
      );
      const conversationId = url.searchParams.get("conversationId");
      if (!email || !conversationId) {
        return new Response("Authentication required", { status: 401 });
      }
      const forwardedHeaders = new Headers(request.headers);
      forwardedHeaders.set("x-moodly-user-email", email);
      forwardedHeaders.set("x-moodly-conversation-id", conversationId);
      const room = env.CHAT_ROOMS.getByName(conversationId);
      return room.fetch(new Request(request, { headers: forwardedHeaders }));
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export { ChatRoom, Matchmaker };
export default worker;
