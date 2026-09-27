import { voiceService } from "../../server/runtime.js";
export default async (request, context) => voiceService.handle(request, context.ip || "deployment");
export const config = { path: "/api/voice" };
