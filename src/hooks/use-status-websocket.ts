import { useCallback, useEffect, useRef } from "react";
import { useGlobalState } from "../global-state/context-provider";
import { getToken } from "../api/auth";
import { TClientInfo } from "../global-state/types";
import { API } from "../api/api";

const WS_RECONNECT_INTERVAL = 3000;
const WS_MAX_RECONNECTS = 10;
const WS_CONNECT_TIMEOUT_MS = 5000;
const WS_POLL_INTERVAL_MS = 5000;

export function useStatusWebSocket() {
  const [, dispatch] = useGlobalState();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsConnected = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollingTimer.current) {
      console.log("[WS] Stopping polling (WebSocket connected)");
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingTimer.current) return; // already polling
    console.log("[WS] Starting heartbeat polling fallback");

    const poll = async () => {
      try {
        const token = getToken();
        if (!token) return;
        const response = await API.sendHeartbeat();
        const clients: TClientInfo[] = (response.clients || []).map((c) => ({
          clientId: c.clientId,
          name: c.name,
          role: c.role,
          location: c.location,
        }));
        dispatch({ type: "SET_ONLINE_CLIENTS", payload: clients });
      } catch (e) {
        console.warn("[WS] Heartbeat polling failed:", e);
      }
    };

    poll(); // immediate first poll
    pollingTimer.current = setInterval(poll, WS_POLL_INTERVAL_MS);
  }, [dispatch]);

  const connect = useCallback(() => {
    // Don't open a second connection if one is already open or connecting
    if (
      wsRef.current &&
      wsRef.current.readyState !== WebSocket.CLOSED
    ) {
      return;
    }

    const token = getToken();
    if (!token) return;

    const backendUrl =
      import.meta.env.VITE_BACKEND_URL || "http://localhost:8000/";
    const wsUrl = backendUrl.replace(/^http/, "ws").replace(/\/$/, "");
    const url = `${wsUrl}/api/v1/ws?token=${token}`;

    console.log(`[WS] Connecting to ${url}`);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    // Start polling fallback if WS doesn't connect within WS_CONNECT_TIMEOUT_MS
    const fallbackTimeout = setTimeout(() => {
      if (!wsConnected.current) {
        console.warn(
          `[WS] WebSocket failed to connect within ${WS_CONNECT_TIMEOUT_MS}ms, starting polling fallback`
        );
        startPolling();
      }
    }, WS_CONNECT_TIMEOUT_MS);

    ws.onopen = () => {
      console.log("[WS] Connected successfully");
      wsConnected.current = true;
      clearTimeout(fallbackTimeout);
      stopPolling(); // stop polling if it was started
      reconnectCount.current = 0;
      dispatch({
        type: "SET_WS_SEND_MESSAGE",
        payload: (message: object) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
          }
        },
      });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string);
        console.log(`[WS] Received: ${data.type as string}`);
        switch (data.type) {
          case "client_list":
            dispatch({
              type: "SET_ONLINE_CLIENTS",
              payload: data.clients as TClientInfo[],
            });
            break;
          case "client_connected":
            dispatch({
              type: "CLIENT_CONNECTED",
              payload: data.client as TClientInfo,
            });
            break;
          case "client_disconnected":
            dispatch({
              type: "CLIENT_DISCONNECTED",
              payload: data.clientId as string,
            });
            break;
          case "call_incoming":
            dispatch({
              type: "CALL_INCOMING",
              payload: {
                callId: data.callId as string,
                caller: data.caller as {
                  clientId: string;
                  name: string;
                  role: string;
                  location: string;
                },
              },
            });
            break;
          case "call_started":
            dispatch({
              type: "CALL_STARTED",
              payload: {
                callId: data.callId as string,
                callerId: data.callerId as string,
                calleeId: data.calleeId as string,
                callerName: data.callerName as string,
                calleeName: data.calleeName as string,
              },
            });
            break;
          case "call_ended":
            dispatch({
              type: "CALL_ENDED",
              payload: {
                callId: data.callId as string,
                endedBy: data.endedBy as string,
              },
            });
            break;
          case "talk_start":
            dispatch({
              type: "TALK_START",
              payload: {
                clientId: data.clientId as string,
                clientName: data.clientName as string,
                callIds: data.callIds as string[],
              },
            });
            break;
          case "talk_stop":
            dispatch({
              type: "TALK_STOP",
              payload: data.clientId as string,
            });
            break;
          case "active_talks":
            dispatch({
              type: "SET_ACTIVE_TALKERS",
              payload: (data.talks || {}) as Record<string, string[]>,
            });
            break;
          default:
            break;
        }
      } catch {
        // Ignore non-JSON messages (ping/pong handled by browser)
      }
    };

    ws.onclose = (event) => {
      console.log(`[WS] Connection closed, code=${event.code}`);
      clearTimeout(fallbackTimeout);
      wsConnected.current = false;
      wsRef.current = null;
      dispatch({ type: "SET_WS_SEND_MESSAGE", payload: null });
      // Don't reconnect on intentional auth failure or replacement
      if (event.code === 4001 || event.code === 4002) return;
      if (reconnectCount.current < WS_MAX_RECONNECTS) {
        reconnectCount.current++;
        console.log(
          `[WS] Reconnecting (${reconnectCount.current}/${WS_MAX_RECONNECTS})`
        );
        reconnectTimer.current = setTimeout(connect, WS_RECONNECT_INTERVAL);
      } else {
        // Reconnects exhausted — fall back to polling
        startPolling();
      }
    };

    ws.onerror = () => {
      // Will trigger onclose
    };
  }, [dispatch, startPolling, stopPolling]);

  const disconnect = useCallback(() => {
    stopPolling();
    wsConnected.current = false;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "Client disconnect");
      wsRef.current = null;
    }
  }, [stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
      disconnect();
    };
  }, [disconnect, stopPolling]);

  return { connect, disconnect };
}
