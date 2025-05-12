import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

const SOCKET_URL = "https://collaborative-whiteboard-2xlo.onrender.com";
// "http://localhost:5000";

let socket: Socket | null = null;
let hasDisconnectedBefore = false;
let isReconnecting = false;

let lastLargePayloadTime = 0;
const LARGE_PAYLOAD_COOLDOWN = 2000;

export const GetSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 30000,
    });

    socket.on("connect", () => {
      if (hasDisconnectedBefore) {
        const savedRoom = localStorage.getItem("room");
        const savedUserData = localStorage.getItem("user");

        if (savedRoom && savedUserData) {
          socket?.emit("reconnection-info", {
            room: JSON.parse(savedRoom),
            user: JSON.parse(savedUserData),
          });
        }

        toast.success("Reconnected to server!");
      }

      console.log("✅ Connected to server:", socket?.id);
      isReconnecting = false;
    });

    socket.on("disconnect", (reason) => {
      hasDisconnectedBefore = true;
      console.warn("❌ Disconnected:", reason);
      toast.warning(`Disconnected: ${reason}. Trying to reconnect...`);
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Reconnect attempt #${attempt}`);
      isReconnecting = true;
    });

    socket.on("reconnect", () => {
      toast.success("Reconnected!");
      isReconnecting = false;
    });

    socket.on("reconnect_failed", () => {
      if (!isReconnecting) {
        toast.error("Failed to reconnect. Reloading...");
        setTimeout(() => {
          // window.location.reload(); // Keep commented for safety
        }, 3000);
      }
    });

    socket.on("connect_error", (err) => {
      toast.error(`Connection error: ${err.message}`);
      if (!isReconnecting) {
        setTimeout(() => {
          if (!socket?.connected) {
            toast.error("Reloading in 5s due to persistent connection issues");
            setTimeout(() => {
              // window.location.reload(); // Optional fallback
            }, 5000);
          }
        }, 10000);
      }
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
      toast.error(`Socket error: ${err.message || "Unknown error"}`);
    });
  }

  return socket;
};

export const canSendLargePayload = (): boolean => {
  const now = Date.now();
  if (now - lastLargePayloadTime > LARGE_PAYLOAD_COOLDOWN) {
    lastLargePayloadTime = now;
    return true;
  }
  return false;
};
