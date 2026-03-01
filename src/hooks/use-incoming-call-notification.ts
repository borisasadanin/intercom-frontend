import { useEffect, useRef } from "react";
import { useGlobalState } from "../global-state/context-provider";
import { TP2PCall } from "../global-state/types";
import connectionStart from "../assets/sounds/start-connection-451.wav";

export const useIncomingCallNotification = (): {
  pendingIncomingCalls: TP2PCall[];
} => {
  const [{ p2pCalls }] = useGlobalState();
  const notifiedCallIds = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Request Notification permission on first user click
  useEffect(() => {
    const requestPermission = () => {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    };
    document.addEventListener("click", requestPermission, { once: true });
    return () => document.removeEventListener("click", requestPermission);
  }, []);

  // Watch p2pCalls for new incoming pending calls
  useEffect(() => {
    const currentCallIds = new Set(p2pCalls.map((c) => c.callId));

    // Clean up notified set for calls that no longer exist
    for (const notifiedId of notifiedCallIds.current) {
      if (!currentCallIds.has(notifiedId)) {
        notifiedCallIds.current.delete(notifiedId);
      }
    }

    // Notify for new incoming pending calls
    for (const call of p2pCalls) {
      if (
        call.direction === "incoming" &&
        call.state === "pending" &&
        !notifiedCallIds.current.has(call.callId)
      ) {
        notifiedCallIds.current.add(call.callId);

        // Play audio cue
        if (!audioRef.current) {
          audioRef.current = new Audio(connectionStart);
          audioRef.current.load();
        }
        audioRef.current.play().catch(() => {
          // Ignore autoplay policy errors — notification still shown visually
        });

        // Send browser notification if permission granted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Inkommande samtal", {
            body: `${call.callerName || "Unknown"} ringer dig`,
            icon: "/favicon.ico",
          });
        }
      }
    }
  }, [p2pCalls]);

  const pendingIncomingCalls = p2pCalls.filter(
    (c) => c.direction === "incoming" && c.state === "pending"
  );

  return { pendingIncomingCalls };
};
