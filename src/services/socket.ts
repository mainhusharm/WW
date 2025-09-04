import { io } from 'socket.io-client';
import { API_CONFIG, WS_CONFIG } from '../api/config';

// Use the correct backend URL from the config file
const socket = io(WS_CONFIG.baseURL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: WS_CONFIG.maxReconnectAttempts,
  reconnectionDelay: WS_CONFIG.reconnectInterval,
  forceNew: true,
  timeout: 20000,
  query: {
    t: Date.now() // Cache busting
  }
});

export default socket;
