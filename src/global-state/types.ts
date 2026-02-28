import {
  Hotkeys,
  TJoinProductionOptions,
  TProduction,
} from "../components/production-line/types.ts";
import { TUserSettings } from "../components/user-settings/types.ts";

export type TClientInfo = {
  clientId: string;
  name: string;
  role: string;
  location: string;
};

export interface ErrorState {
  globalError?: Error | null;
  callErrors?: Record<string, Error> | null;
}

export interface DevicesState {
  input: MediaDeviceInfo[] | null;
  output: MediaDeviceInfo[] | null;
}

export interface CallState {
  joinProductionOptions: TJoinProductionOptions | null;
  // Not all devices allow choosing output
  audiooutput?: string;
  mediaStreamInput: MediaStream | null;
  dominantSpeaker: string | null;
  audioLevelAboveThreshold: boolean;
  connectionState: RTCPeerConnectionState | null;
  audioElements: HTMLAudioElement[] | null;
  sessionId: string | null;
  hotkeys: Hotkeys;
  dataChannel: RTCDataChannel | null;
  isRemotelyMuted: boolean;
}

export type TP2PCall = {
  callId: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  calleeName: string;
  direction: "outgoing" | "incoming";
  state: "pending" | "active" | "ended";
  peerConnection: RTCPeerConnection | null;
  audioElement: HTMLAudioElement | null;
  isTalking: boolean;
};

export type TGlobalState = {
  calls: {
    [key: string]: CallState;
  };
  userSettings: TUserSettings | null;
  production: TProduction | null;
  error: ErrorState;
  reloadProductionList: boolean;
  devices: DevicesState;
  selectedProductionId: string | null;
  apiError: Error | false;
  websocket: WebSocket | null;
  onlineClients: TClientInfo[];
  isRegistered: boolean;
  p2pCalls: TP2PCall[];
  // M3: Talk state - maps clientId to callIds they're currently talking on
  activeTalkers: Record<string, string[]>;
  // M3: WebSocket send function, available once connected
  wsSendMessage: ((message: object) => void) | null;
};
