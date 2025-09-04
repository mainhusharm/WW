import { io } from 'socket.io-client';
import { config } from '../config';

// Use the correct backend URL from the config file
const socket = io(config.api.baseUrl, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 5000,
  forceNew: true,
  timeout: 20000,
  query: {
    t: Date.now() // Cache busting
  }
});

export default socket;
