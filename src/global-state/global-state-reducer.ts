import { Dispatch, Reducer, useReducer } from "react";
import { TGlobalStateAction } from "./global-state-actions";
import { TGlobalState } from "./types";

export const initialGlobalState: TGlobalState = {
  production: null,
  error: { callErrors: null, globalError: null },
  reloadProductionList: false,
  devices: {
    input: null,
    output: null,
  },
  userSettings: null,
  selectedProductionId: null,
  calls: {},
  apiError: false,
  websocket: null,
  onlineClients: [],
  isRegistered: false,
  p2pCalls: [],
  activeTalkers: {},
  wsSendMessage: null,
};

export const globalReducer: Reducer<TGlobalState, TGlobalStateAction> = (
  state,
  action
): TGlobalState => {
  // Simple Debug
  // logger.cyan(
  //   `Global state action: ${action.type}, payload: ${action.payload}`
  // );
  switch (action.type) {
    case "ERROR": {
      const { callId, error } = action.payload;

      if (callId && error) {
        // Call-specific error
        return {
          ...state,
          error: {
            ...state.error,
            callErrors: {
              ...state.error.callErrors,
              [callId]: error,
            },
          },
        };
      }
      // Global error
      return {
        ...state,
        error: {
          ...state.error,
          globalError: error,
        },
      };
    }
    case "PRODUCTION_UPDATED":
      return {
        ...state,
        reloadProductionList: true,
      };
    case "API_NOT_AVAILABLE":
      return {
        ...state,
        apiError: new Error("API not available"),
      };
    case "PRODUCTION_LIST_FETCHED":
      return {
        ...state,
        reloadProductionList: false,
      };
    case "DEVICES_UPDATED":
      return {
        ...state,
        devices: action.payload,
      };
    case "SELECT_PRODUCTION_ID":
      return {
        ...state,
        selectedProductionId: action.payload,
      };
    case "ADD_CALL":
      return {
        ...state,
        calls: {
          ...state.calls,
          [action.payload.id]: action.payload.callState,
        },
      };
    case "UPDATE_CALL":
      if (
        action.payload.updates.audioLevelAboveThreshold &&
        state.calls[action.payload.id].audioLevelAboveThreshold ===
          action.payload.updates.audioLevelAboveThreshold
      )
        return state;
      return {
        ...state,
        calls: {
          ...state.calls,
          [action.payload.id]: {
            ...state.calls[action.payload.id],
            ...action.payload.updates,
          },
        },
      };
    case "REMOVE_CALL": {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { [action.payload.id]: _, ...remainingCalls } = state.calls;

      return {
        ...state,
        calls: remainingCalls,
        production: null,
      };
    }
    case "UPDATE_USER_SETTINGS":
      return {
        ...state,
        userSettings: action.payload,
      };
    case "SET_WEBSOCKET":
      return {
        ...state,
        websocket: action.payload,
      };
    case "HEARTBEAT_ERROR":
      return {
        ...state,
        error: {
          ...state.error,
          callErrors: {
            ...state.error.callErrors,
            [action.payload.sessionId]: action.payload.error,
          },
        },
      };
    case "SET_ONLINE_CLIENTS":
      return { ...state, onlineClients: action.payload };
    case "CLIENT_CONNECTED":
      return {
        ...state,
        onlineClients: [
          ...state.onlineClients.filter(
            (c) => c.clientId !== action.payload.clientId
          ),
          action.payload,
        ],
      };
    case "CLIENT_DISCONNECTED": {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { [action.payload]: _talk, ...remainingTalkers } = state.activeTalkers;
      return {
        ...state,
        onlineClients: state.onlineClients.filter(
          (c) => c.clientId !== action.payload
        ),
        activeTalkers: remainingTalkers,
      };
    }
    case "SET_REGISTERED":
      return { ...state, isRegistered: action.payload };
    case "CALL_INCOMING": {
      // Check if already tracking this call
      if (state.p2pCalls.some((c) => c.callId === action.payload.callId)) return state;
      return {
        ...state,
        p2pCalls: [
          ...state.p2pCalls,
          {
            callId: action.payload.callId,
            callerId: action.payload.caller.clientId,
            calleeId: "",
            callerName: action.payload.caller.name,
            calleeName: "",
            direction: "incoming" as const,
            state: "pending" as const,
            peerConnection: null,
            audioElement: null,
            isTalking: false,
          },
        ],
      };
    }
    case "CALL_STARTED": {
      return {
        ...state,
        p2pCalls: state.p2pCalls.map((c) =>
          c.callId === action.payload.callId
            ? {
                ...c,
                state: "active" as const,
                callerName: action.payload.callerName,
                calleeName: action.payload.calleeName,
              }
            : c
        ),
      };
    }
    case "CALL_ENDED": {
      const call = state.p2pCalls.find((c) => c.callId === action.payload.callId);
      if (call?.peerConnection) {
        call.peerConnection.close();
      }
      if (call?.audioElement) {
        call.audioElement.pause();
        call.audioElement.srcObject = null;
      }
      return {
        ...state,
        p2pCalls: state.p2pCalls.filter((c) => c.callId !== action.payload.callId),
      };
    }
    case "ADD_P2P_CALL":
      return {
        ...state,
        p2pCalls: [...state.p2pCalls, action.payload],
      };
    case "UPDATE_P2P_CALL":
      return {
        ...state,
        p2pCalls: state.p2pCalls.map((c) =>
          c.callId === action.payload.callId
            ? { ...c, ...action.payload.updates }
            : c
        ),
      };
    case "REMOVE_P2P_CALL": {
      const callToRemove = state.p2pCalls.find((c) => c.callId === action.payload);
      if (callToRemove?.peerConnection) {
        callToRemove.peerConnection.close();
      }
      if (callToRemove?.audioElement) {
        callToRemove.audioElement.pause();
        callToRemove.audioElement.srcObject = null;
      }
      return {
        ...state,
        p2pCalls: state.p2pCalls.filter((c) => c.callId !== action.payload),
      };
    }
    case "SET_ACTIVE_CALLS":
      return { ...state, p2pCalls: action.payload };
    case "TALK_START":
      return {
        ...state,
        activeTalkers: {
          ...state.activeTalkers,
          [action.payload.clientId]: action.payload.callIds,
        },
      };
    case "TALK_STOP": {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { [action.payload]: _, ...remaining } = state.activeTalkers;
      return { ...state, activeTalkers: remaining };
    }
    case "SET_ACTIVE_TALKERS":
      return { ...state, activeTalkers: action.payload };
    case "SET_WS_SEND_MESSAGE":
      return { ...state, wsSendMessage: action.payload };
    default:
      return state;
  }
};

export const useInitializeGlobalStateReducer = (): [
  TGlobalState,
  Dispatch<TGlobalStateAction>,
] => useReducer(globalReducer, initialGlobalState);
