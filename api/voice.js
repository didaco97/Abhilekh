import { voiceService } from "../server/runtime.js";
export default {
  async fetch(request) {
    return voiceService.handle(request, request.headers.get("x-vercel-forwarded-for") || "deployment");
  },
};
