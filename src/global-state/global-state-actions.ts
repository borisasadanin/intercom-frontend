import { TUserSettings } from "../components/user-settings/types.ts";
import { CallState, DevicesState, TClientInfo, TP2PCall } from "./types.ts";

export type TGlobalStateAction =
  | TPublishError
  | TProductionCreated
  | TApiNotAvailable
  | TProductionListFetched
  | TUpdateUserSettings
  | TUpdateDevicesAction
  | TSelectProductionId
  | TAddCallState
  | TUpdateCallState
  | TRemoveCallState
  | TSetWebSocket
  | THeartbeatError
  | TSetOnlineClients
  | TClientConnected
  | TClientDisconnected
  | TSetRegistered
  | TCallIncoming
  | TCallStarted
  | TCallEnded
  | TAddP2PCall
  | TUpdateP2PCall
  | TRemoveP2PCall
  | TSetActiveCalls
  | TTalkStart
  | TTalkStop
  | TSetActiveTalkers
  | TSetWsSendMessage
  | TSetAudioStream;

export type TPublishError = {
  type: "ERROR";
  payload: { callId?: string; error: Error | null };
};

export type TProductionCreated = {
  type: "PRODUCTION_UPDATED";
};

export type TApiNotAvailable = {
  type: "API_NOT_AVAILABLE";
};

export type TProductionListFetched = {
  type: "PRODUCTION_LIST_FETCHED";
};

export type TUpdateDevicesAction = {
  type: "DEVICES_UPDATED";
  payload: DevicesState;
};

export type TSelectProductionId = {
  type: "SELECT_PRODUCTION_ID";
  payload: string | null;
};

export type TAddCallState = {
  type: "ADD_CALL";
  payload: { id: string; callState: CallState };
};

export type TUpdateCallState = {
  type: "UPDATE_CALL";
  payload: { id: string; updates: Partial<CallState> };
};

export type TRemoveCallState = {
  type: "REMOVE_CALL";
  payload: { id: string };
};

export type TUpdateUserSettings = {
  type: "UPDATE_USER_SETTINGS";
  payload: TUserSettings | null;
};

export type TSetWebSocket = {
  type: "SET_WEBSOCKET";
  payload: WebSocket | null;
};

export type THeartbeatError = {
  type: "HEARTBEAT_ERROR";
  payload: { sessionId: string; error: Error };
};

export type TSetOnlineClients = {
  type: "SET_ONLINE_CLIENTS";
  payload: TClientInfo[];
};

export type TClientConnected = {
  type: "CLIENT_CONNECTED";
  payload: TClientInfo;
};

export type TClientDisconnected = {
  type: "CLIENT_DISCONNECTED";
  payload: string;
};

export type TSetRegistered = {
  type: "SET_REGISTERED";
  payload: boolean;
};

export type TCallIncoming = {
  type: "CALL_INCOMING";
  payload: {
    callId: string;
    caller: { clientId: string; name: string; role: string; location: string };
  };
};

export type TCallStarted = {
  type: "CALL_STARTED";
  payload: {
    callId: string;
    callerId: string;
    calleeId: string;
    callerName: string;
    calleeName: string;
  };
};

export type TCallEnded = {
  type: "CALL_ENDED";
  payload: {
    callId: string;
    endedBy: string;
  };
};

export type TAddP2PCall = {
  type: "ADD_P2P_CALL";
  payload: TP2PCall;
};

export type TUpdateP2PCall = {
  type: "UPDATE_P2P_CALL";
  payload: { callId: string; updates: Partial<TP2PCall> };
};

export type TRemoveP2PCall = {
  type: "REMOVE_P2P_CALL";
  payload: string;
};

export type TSetActiveCalls = {
  type: "SET_ACTIVE_CALLS";
  payload: TP2PCall[];
};

export type TTalkStart = {
  type: "TALK_START";
  payload: {
    clientId: string;
    clientName: string;
    callIds: string[];
  };
};

export type TTalkStop = {
  type: "TALK_STOP";
  payload: string; // clientId
};

export type TSetActiveTalkers = {
  type: "SET_ACTIVE_TALKERS";
  payload: Record<string, string[]>;
};

export type TSetWsSendMessage = {
  type: "SET_WS_SEND_MESSAGE";
  payload: ((message: object) => void) | null;
};

export type TSetAudioStream = {
  type: "SET_AUDIO_STREAM";
  payload: { stream: MediaStream | null };
};
