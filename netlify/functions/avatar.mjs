import { avatarService } from '../../server/runtime.js';
export default async request => avatarService.handle(request);
export const config = {
  path: '/api/avatar',
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
