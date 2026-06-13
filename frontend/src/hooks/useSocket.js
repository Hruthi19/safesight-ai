import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

export function useSocket(onEvent) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const socket = io(WS_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("incident:new", (data) => {
      onEventRef.current?.("incident:new", data);
    });
    socket.on("incident:updated", (data) => {
      onEventRef.current?.("incident:updated", data);
    });
    socket.on("incident:escalated", (data) => {
      onEventRef.current?.("incident:escalated", data);
    });

    return () => socket.disconnect();
  }, []);

  return { connected, socket: socketRef.current };
}
