import { researchService } from "../server/runtime.js";

// Vercel Web Handler. The credential stays in server environment settings.
export default {
  async fetch(request) {
    return researchService.handle(
      request,
      request.headers.get("x-vercel-forwarded-for") || "deployment",
    );
  },
};
