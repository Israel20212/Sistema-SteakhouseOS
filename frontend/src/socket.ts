import { io } from "socket.io-client";

const URL = "http://localhost:3000";

export const socket = io(URL, {
    autoConnect: true,
});

socket.on('connect', () => {
    console.log('Connected to WebSocket server:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from WebSocket server');
});
