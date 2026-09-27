import { researchService } from "../../server/runtime.js";
export default async (request, context) =>
  researchService.handle(request, context.ip || "deployment");
export const config = {
  path: "/api/chat",
  rateLimit: { windowLimit: 12, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
