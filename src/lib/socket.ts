import { io, Socket } from 'socket.io-client';

// Create a singleton socket instance
let socket: Socket | null = null;


export const getSocket = (token?: string): Socket => {
  if (!socket) {
    // Initialize socket connection with the server
      console.log("🔌 Creating socket connection");
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001', {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token: token || localStorage.getItem('token') || undefined
      }
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};