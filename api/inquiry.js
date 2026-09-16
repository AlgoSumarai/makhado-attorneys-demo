import { createServer } from '../server.mjs';

// Reuse the validated inquiry endpoint without opening a listening socket.
const handler = createServer().listeners('request')[0];
export default function inquiry(request, response) {
  return handler(request, response);
}
