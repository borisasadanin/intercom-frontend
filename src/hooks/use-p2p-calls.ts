import { useCallback } from "react";
import { useGlobalState } from "../global-state/context-provider";
import { API } from "../api/api";
import { waitForIceGathering } from "../components/production-line/ice-gathering";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

async function setupPeerConnection(
  audioStream: MediaStream | null,
  audioOutputDeviceId: string | undefined,
  onRemoteTrack: (audioElement: HTMLAudioElement) => void
): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // Add local audio track if we have one — start muted (PTT toggles enabled)
  if (audioStream) {
    audioStream.getTracks().forEach((track) => {
      track.enabled = false;
      pc.addTrack(track, audioStream);
    });
  }

  // Handle remote audio tracks
  pc.ontrack = ({ streams }) => {
    const stream = streams[0];
    if (stream && stream.getAudioTracks().length > 0) {
      const audio = new Audio();
      audio.srcObject = stream;
      audio.autoplay = true;
      if (audioOutputDeviceId && "setSinkId" in audio) {
        (audio as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> })
          .setSinkId(audioOutputDeviceId)
          .catch(() => {});
      }
      onRemoteTrack(audio);
    }
  };

  return pc;
}

export function useP2PCalls(sendWsMessage?: (message: object) => void) {
  const [{ p2pCalls }, dispatch] = useGlobalState();

  const initiateCall = useCallback(
    async (
      calleeId: string,
      audioStream: MediaStream | null,
      audioOutput?: string
    ): Promise<string | null> => {
      try {
        // 1. POST /api/v1/call to get SDP offer
        const response = await API.initiateCall({ calleeId });

        // 2. Create PeerConnection + wire up remote track handler
        const pc = await setupPeerConnection(audioStream, audioOutput, (el) => {
          dispatch({
            type: "UPDATE_P2P_CALL",
            payload: { callId: response.callId, updates: { audioElement: el } },
          });
        });

        // 3. Add the call to state BEFORE WebRTC negotiation
        dispatch({
          type: "ADD_P2P_CALL",
          payload: {
            callId: response.callId,
            callerId: response.callerId,
            calleeId: response.calleeId,
            callerName: "",
            calleeName: "",
            direction: "outgoing",
            state: "pending",
            peerConnection: pc,
            audioElement: null,
            isTalking: false,
          },
        });

        // 4. Set remote description (SDP offer from server)
        await pc.setRemoteDescription({ sdp: response.sdpOffer, type: "offer" });

        // 5. Create SDP answer
        const answer = await pc.createAnswer();
        if (!answer.sdp) throw new Error("No SDP in answer");
        await pc.setLocalDescription(answer);

        // 6. Wait for ICE gathering
        await waitForIceGathering(pc);

        // 7. Send SDP answer to server
        await API.callerAnswer({ callId: response.callId, sdpAnswer: answer.sdp });

        return response.callId;
      } catch {
        dispatch({
          type: "ERROR",
          payload: {
            error: new Error(
              "Could not start call. The other client may be offline."
            ),
          },
        });
        return null;
      }
    },
    [dispatch]
  );

  const handleIncomingCall = useCallback(
    async (
      callId: string,
      audioStream: MediaStream | null,
      audioOutput?: string
    ): Promise<void> => {
      try {
        // 1. POST /api/v1/call/:callId/join to get SDP offer
        const response = await API.joinCall({ callId });

        // 2. Create PeerConnection + wire up remote track handler
        const pc = await setupPeerConnection(audioStream, audioOutput, (el) => {
          dispatch({
            type: "UPDATE_P2P_CALL",
            payload: { callId, updates: { audioElement: el } },
          });
        });

        // 3. Update the call state with peerConnection
        dispatch({
          type: "UPDATE_P2P_CALL",
          payload: {
            callId,
            updates: {
              peerConnection: pc,
              calleeId: response.calleeId,
            },
          },
        });

        // 4. Set remote description (SDP offer from server)
        await pc.setRemoteDescription({ sdp: response.sdpOffer, type: "offer" });

        // 5. Create SDP answer
        const answer = await pc.createAnswer();
        if (!answer.sdp) throw new Error("No SDP in answer");
        await pc.setLocalDescription(answer);

        // 6. Wait for ICE gathering
        await waitForIceGathering(pc);

        // 7. Send SDP answer to server
        await API.calleeAnswer({ callId, sdpAnswer: answer.sdp });
      } catch {
        dispatch({
          type: "ERROR",
          payload: {
            error: new Error("Could not join incoming call."),
          },
        });
      }
    },
    [dispatch]
  );

  const endCall = useCallback(
    async (callId: string): Promise<void> => {
      try {
        await API.endCall({ callId });
        // The WebSocket call_ended event will handle cleanup via CALL_ENDED action
      } catch {
        // Force-remove from local state even if API fails
        dispatch({ type: "REMOVE_P2P_CALL", payload: callId });
      }
    },
    [dispatch]
  );

  const togglePTT = useCallback(
    (callId: string, talking: boolean): void => {
      const call = p2pCalls.find((c) => c.callId === callId);
      if (!call?.peerConnection) return;

      // Toggle audio track enabled state (pre-open track, toggle enabled pattern)
      const senders = call.peerConnection.getSenders();
      senders.forEach((sender) => {
        if (sender.track?.kind === "audio") {
          sender.track.enabled = talking;
        }
      });

      dispatch({
        type: "UPDATE_P2P_CALL",
        payload: { callId, updates: { isTalking: talking } },
      });

      // Send talk event via WebSocket
      if (sendWsMessage) {
        if (talking) {
          // Include this call plus any other calls already talking
          const talkingCallIds = p2pCalls
            .filter((c) => c.isTalking && c.callId !== callId)
            .map((c) => c.callId);
          talkingCallIds.push(callId);
          sendWsMessage({ type: "talk_start", callIds: talkingCallIds });
        } else {
          // Check if still talking on other calls
          const stillTalking = p2pCalls.some(
            (c) => c.isTalking && c.callId !== callId
          );
          if (!stillTalking) {
            sendWsMessage({ type: "talk_stop" });
          } else {
            const remainingCallIds = p2pCalls
              .filter((c) => c.isTalking && c.callId !== callId)
              .map((c) => c.callId);
            sendWsMessage({ type: "talk_start", callIds: remainingCallIds });
          }
        }
      }
    },
    [p2pCalls, dispatch, sendWsMessage]
  );

  const toggleAllPTT = useCallback(
    (talking: boolean): void => {
      const activeCalls = p2pCalls.filter((c) => c.state === "active");

      // Toggle audio tracks on all active calls
      activeCalls.forEach((call) => {
        if (call.peerConnection) {
          call.peerConnection.getSenders().forEach((sender) => {
            if (sender.track?.kind === "audio") {
              sender.track.enabled = talking;
            }
          });
        }
      });

      // Update state for all active calls
      activeCalls.forEach((call) => {
        dispatch({
          type: "UPDATE_P2P_CALL",
          payload: { callId: call.callId, updates: { isTalking: talking } },
        });
      });

      // Send talk event via WebSocket
      if (sendWsMessage) {
        if (talking) {
          const callIds = activeCalls.map((c) => c.callId);
          sendWsMessage({ type: "talk_start", callIds });
        } else {
          sendWsMessage({ type: "talk_stop" });
        }
      }
    },
    [p2pCalls, dispatch, sendWsMessage]
  );

  return {
    p2pCalls,
    initiateCall,
    handleIncomingCall,
    endCall,
    togglePTT,
    toggleAllPTT,
  };
}
