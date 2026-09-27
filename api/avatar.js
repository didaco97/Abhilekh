import { avatarService } from '../server/runtime.js';
export default { fetch: request => avatarService.handle(request) };
