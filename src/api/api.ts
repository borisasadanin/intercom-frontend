import { handleFetchRequest } from "./handle-fetch-request.ts";
import { getToken } from "./auth.ts";

const API_VERSION = import.meta.env.VITE_BACKEND_API_VERSION ?? "api/v1/";
const API_URL =
  `${import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, "")}/${API_VERSION}` ||
  `${window.location.origin}/${API_VERSION}`;
const API_KEY = import.meta.env.VITE_BACKEND_API_KEY;

type TCreateProductionOptions = {
  name: string;
  lines: { name: string; programOutputLine?: boolean }[];
};

type TParticipant = {
  name: string;
  sessionId: string;
  endpointId: string;
  isActive: boolean;
  isWhip: boolean;
};

type TLine = {
  name: string;
  id: string;
  smbConferenceId: string;
  participants: TParticipant[];
  programOutputLine?: boolean;
};

export type TBasicProductionResponse = {
  name: string;
  productionId: string;
  lines: TLine[];
};

export type TListProductionsResponse = {
  productions: TBasicProductionResponse[];
  offset: 0;
  limit: 0;
  totalItems: 0;
};

type TOfferAudioSessionOptions = {
  productionId: number;
  lineId: number;
  username: string;
};

type TOfferAudioSessionResponse = {
  sdp: string;
  sessionId: string;
};

type TPatchAudioSessionOptions = {
  sessionId: string;
  sdpAnswer: string;
};

type TPatchAudioSessionResponse = null;

type TDeleteAudioSessionOptions = {
  sessionId: string;
};

type THeartbeatOptions = {
  sessionId: string;
};

export type TShareUrlOptions = {
  path: string;
};

type TShareUrlResponse = {
  url: string;
};

type TUpdateProductionNameOptions = {
  productionId: string;
  name: string;
};

type TUpdateLineNameOptions = {
  productionId: string;
  lineId: string;
  name: string;
};

type TRegisterClientOptions = {
  name: string;
  role: string;
  location: string;
  existingClientId?: string;
};

export type TRegisterClientResponse = {
  clientId: string;
  token: string;
  name: string;
  role: string;
  location: string;
};

export type TClientProfile = {
  clientId: string;
  name: string;
  role: string;
  location: string;
  isOnline: boolean;
  createdAt: string;
  lastSeenAt: string;
};

export type TClientListItem = {
  clientId: string;
  name: string;
  role: string;
  location: string;
  isOnline: boolean;
  lastSeenAt: string;
};

export type TClientListResponse = {
  clients: TClientListItem[];
};

type TUpdateMyProfileOptions = {
  name?: string;
  role?: string;
  location?: string;
};

export type TCallInitiateResponse = {
  callId: string;
  sdpOffer: string;
  callerId: string;
  calleeId: string;
};

export type TCallJoinResponse = {
  callId: string;
  sdpOffer: string;
  callerId: string;
  calleeId: string;
};

export type TCallStatusResponse = {
  callId: string;
  status: string;
};

export type TCallActiveItem = {
  callId: string;
  callerId: string;
  calleeId: string;
  callerName: string;
  calleeName: string;
  state: string;
  direction: string;
  createdAt: string;
};

export type TCallActiveResponse = {
  calls: TCallActiveItem[];
};

export const API = {
  createProduction: async ({ name, lines }: TCreateProductionOptions) =>
    handleFetchRequest<TBasicProductionResponse>(
      fetch(`${API_URL}production/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({
          name,
          lines,
        }),
      })
    ),
  updateProductionName: async ({
    productionId,
    name,
  }: TUpdateProductionNameOptions) =>
    handleFetchRequest<TBasicProductionResponse>(
      fetch(`${API_URL}production/${productionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({
          name,
        }),
      })
    ),
  updateLineName: async ({
    productionId,
    lineId,
    name,
  }: TUpdateLineNameOptions) =>
    handleFetchRequest<TBasicProductionResponse>(
      fetch(`${API_URL}production/${productionId}/line/${lineId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({
          name,
        }),
      })
    ),
  listProductions: ({
    searchParams,
  }: {
    searchParams: string;
  }): Promise<TListProductionsResponse> =>
    handleFetchRequest<TListProductionsResponse>(
      fetch(`${API_URL}productionlist?${searchParams}`, {
        method: "GET",
        headers: {
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
      })
    ),
  fetchProduction: (id: number): Promise<TBasicProductionResponse> =>
    handleFetchRequest<TBasicProductionResponse>(
      fetch(`${API_URL}production/${id}`, {
        method: "GET",
        headers: {
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
      })
    ),
  deleteProduction: (id: string): Promise<string> =>
    handleFetchRequest<string>(
      fetch(`${API_URL}production/${id}`, {
        method: "DELETE",
        headers: {
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
      })
    ),
  listProductionLines: (id: number) =>
    handleFetchRequest<TLine[]>(
      fetch(`${API_URL}production/${id}/line`, {
        method: "GET",
        headers: {
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
      })
    ),
  fetchProductionLine: (productionId: number, lineId: number): Promise<TLine> =>
    handleFetchRequest<TLine>(
      fetch(`${API_URL}production/${productionId}/line/${lineId}`, {
        method: "GET",
        headers: {
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
      })
    ),
  addProductionLine: (
    productionId: string,
    name: string,
    programOutputLine?: boolean
  ): Promise<TLine> =>
    handleFetchRequest<TLine>(
      fetch(`${API_URL}production/${productionId}/line`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({
          name,
          programOutputLine,
        }),
      })
    ),
  deleteProductionLine: (
    productionId: string,
    lineId: string
  ): Promise<string> =>
    handleFetchRequest<string>(
      fetch(`${API_URL}production/${productionId}/line/${lineId}`, {
        method: "DELETE",
        headers: {
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
      })
    ),

  offerAudioSession: ({
    productionId,
    lineId,
    username,
  }: TOfferAudioSessionOptions): Promise<TOfferAudioSessionResponse> =>
    handleFetchRequest<TOfferAudioSessionResponse>(
      fetch(`${API_URL}session/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({
          productionId,
          lineId,
          username,
        }),
      })
    ),
  patchAudioSession: ({
    sessionId,
    sdpAnswer,
  }: TPatchAudioSessionOptions): Promise<TPatchAudioSessionResponse> =>
    handleFetchRequest<TPatchAudioSessionResponse>(
      fetch(`${API_URL}session/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({
          sdpAnswer,
        }),
      })
    ),
  deleteAudioSession: ({
    sessionId,
  }: TDeleteAudioSessionOptions): Promise<string> =>
    handleFetchRequest<string>(
      fetch(`${API_URL}session/${sessionId}`, {
        method: "DELETE",
        headers: {
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
      })
    ),
  heartbeat: ({ sessionId }: THeartbeatOptions): Promise<string> =>
    handleFetchRequest<string>(
      fetch(`${API_URL}heartbeat/${sessionId}`, {
        method: "GET",
        headers: {
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
      })
    ),
  shareUrl: ({ path }: TShareUrlOptions): Promise<TShareUrlResponse> => {
    return handleFetchRequest<TShareUrlResponse>(
      fetch(`${API_URL}share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({
          path,
        }),
      })
    );
  },
  reauth: async (): Promise<void> => {
    return handleFetchRequest<void>(
      fetch(`${API_URL}reauth`, {
        method: "GET",
        headers: {
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
      })
    );
  },

  registerClient: async ({
    name,
    role,
    location,
    existingClientId,
  }: TRegisterClientOptions): Promise<TRegisterClientResponse> =>
    handleFetchRequest<TRegisterClientResponse>(
      fetch(`${API_URL}client/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          role,
          location,
          ...(existingClientId ? { existingClientId } : {}),
        }),
      })
    ),

  getMyProfile: async (): Promise<TClientProfile> =>
    handleFetchRequest<TClientProfile>(
      fetch(`${API_URL}client/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
    ),

  updateMyProfile: async ({
    name,
    role,
    location,
  }: TUpdateMyProfileOptions): Promise<TClientProfile> =>
    handleFetchRequest<TClientProfile>(
      fetch(`${API_URL}client/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ...(name !== undefined ? { name } : {}),
          ...(role !== undefined ? { role } : {}),
          ...(location !== undefined ? { location } : {}),
        }),
      })
    ),

  getOnlineClients: async (): Promise<TClientListResponse> =>
    handleFetchRequest<TClientListResponse>(
      fetch(`${API_URL}client/list`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
    ),

  getClientById: async ({
    clientId,
  }: {
    clientId: string;
  }): Promise<TClientProfile> =>
    handleFetchRequest<TClientProfile>(
      fetch(`${API_URL}client/${clientId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
    ),

  initiateCall: async ({
    calleeId,
  }: {
    calleeId: string;
  }): Promise<TCallInitiateResponse> =>
    handleFetchRequest<TCallInitiateResponse>(
      fetch(`${API_URL}call`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ calleeId }),
      })
    ),

  callerAnswer: async ({
    callId,
    sdpAnswer,
  }: {
    callId: string;
    sdpAnswer: string;
  }): Promise<TCallStatusResponse> =>
    handleFetchRequest<TCallStatusResponse>(
      fetch(`${API_URL}call/${callId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ sdpAnswer }),
      })
    ),

  joinCall: async ({ callId }: { callId: string }): Promise<TCallJoinResponse> =>
    handleFetchRequest<TCallJoinResponse>(
      fetch(`${API_URL}call/${callId}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({}),
      })
    ),

  calleeAnswer: async ({
    callId,
    sdpAnswer,
  }: {
    callId: string;
    sdpAnswer: string;
  }): Promise<TCallStatusResponse> =>
    handleFetchRequest<TCallStatusResponse>(
      fetch(`${API_URL}call/${callId}/answer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ sdpAnswer }),
      })
    ),

  endCall: async ({ callId }: { callId: string }): Promise<TCallStatusResponse> =>
    handleFetchRequest<TCallStatusResponse>(
      fetch(`${API_URL}call/${callId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
    ),

  getActiveCalls: async (): Promise<TCallActiveResponse> =>
    handleFetchRequest<TCallActiveResponse>(
      fetch(`${API_URL}call/active`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
    ),
};
