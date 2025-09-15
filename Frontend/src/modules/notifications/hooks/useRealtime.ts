import { useEffect, useState } from "react";

export function useRealtime(channel: string) {
  const [events, setEvents] = useState<any[]>([]);
  useEffect(() => {
    // TODO: Replace with real WebSocket/SSE logic
    const interval = setInterval(() => {
      setEvents((evts) => [...evts, { message: `Live event on ${channel} at ${new Date().toLocaleTimeString()}` }]);
    }, 10000);
    return () => clearInterval(interval);
  }, [channel]);
  return { events };
}
