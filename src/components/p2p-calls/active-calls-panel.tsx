import { useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { useP2PCalls } from "../../hooks/use-p2p-calls";
import { TP2PCall } from "../../global-state/types";

const Panel = styled.div`
  background: #23292c;
  border-radius: 0.8rem;
  padding: 1.5rem;
  border: 0.1rem solid rgba(109, 109, 109, 0.3);
  margin-top: 1.5rem;
`;

const PanelTitle = styled.h3`
  font-size: 1.4rem;
  color: rgba(89, 203, 232, 1);
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 0.1rem solid rgba(109, 109, 109, 0.3);
  font-weight: 600;
`;

const CallItem = styled.div<{ isActive?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 0;
  border-bottom: 0.1rem solid rgba(109, 109, 109, 0.15);
  transition: background 0.1s ease, border-left 0.1s ease;

  ${(p) =>
    p.isActive &&
    `
    background: rgba(29, 185, 84, 0.1);
    border-left: 0.3rem solid #1db954;
    padding-left: calc(0.8rem - 0.3rem);
  `}

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const CallInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
`;

const DirectionBadge = styled.span<{ direction: "outgoing" | "incoming" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: 700;
  flex-shrink: 0;
  background: ${({ direction }) =>
    direction === "outgoing"
      ? "rgba(89, 203, 232, 0.2)"
      : "rgba(29, 185, 84, 0.2)"};
  color: ${({ direction }) =>
    direction === "outgoing" ? "rgba(89, 203, 232, 1)" : "#1db954"};
`;

const CallName = styled.span`
  color: white;
  font-weight: 600;
  font-size: 1.3rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CallState = styled.span`
  color: #888;
  font-size: 1rem;
  flex-shrink: 0;
`;

const CallActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  margin-left: 0.8rem;
`;

const PTTButton = styled.button<{ isTalking: boolean }>`
  background: ${({ isTalking }) => (isTalking ? "#1db954" : "#444")};
  color: white;
  border: none;
  border-radius: 0.4rem;
  padding: 0.4rem 1rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  user-select: none;
  transition: background 0.1s ease;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: ${({ isTalking }) => (isTalking ? "#17a349" : "#555")};
  }
`;

const EndButton = styled.button`
  background: #cc3333;
  color: white;
  border: none;
  border-radius: 0.4rem;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;

  &:hover {
    background: #b52b2b;
  }
`;

const MasterPTTSection = styled.div`
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 0.1rem solid rgba(109, 109, 109, 0.3);
  display: flex;
  justify-content: center;
`;

const MasterPTTButton = styled.button<{ isTalking: boolean }>`
  background: ${({ isTalking }) => (isTalking ? "#1db954" : "#444")};
  color: white;
  border: none;
  border-radius: 0.4rem;
  padding: 0.6rem 2.4rem;
  cursor: pointer;
  font-weight: 700;
  font-size: 1.3rem;
  user-select: none;
  transition: background 0.1s ease;
  width: 100%;

  &:hover {
    background: ${({ isTalking }) => (isTalking ? "#17a349" : "#555")};
  }
`;

export function ActiveCallsPanel({
  audioStream,
  audioOutput,
  sendWsMessage,
}: {
  audioStream: MediaStream | null;
  audioOutput?: string;
  sendWsMessage?: (message: object) => void;
}) {
  const { p2pCalls, handleIncomingCall, endCall, togglePTT, toggleAllPTT } =
    useP2PCalls(sendWsMessage);
  const processedIncoming = useRef<Set<string>>(new Set());

  const handleEndCall = (callId: string) => {
    if (window.confirm("End this call?")) {
      endCall(callId);
    }
  };

  // Auto-join incoming calls (D5: auto-listen)
  useEffect(() => {
    p2pCalls.forEach((call: TP2PCall) => {
      if (
        call.direction === "incoming" &&
        call.state === "pending" &&
        !call.peerConnection &&
        !processedIncoming.current.has(call.callId)
      ) {
        processedIncoming.current.add(call.callId);
        handleIncomingCall(call.callId, audioStream, audioOutput);
      }
    });
  }, [p2pCalls, handleIncomingCall, audioStream, audioOutput]);

  // Filter to non-ended calls
  const activeCalls = p2pCalls.filter((c: TP2PCall) => c.state !== "ended");
  const activeReadyCalls = activeCalls.filter(
    (c: TP2PCall) => c.state === "active"
  );
  const isMasterTalking = activeReadyCalls.some((c: TP2PCall) => c.isTalking);

  if (activeCalls.length === 0) return null;

  return (
    <Panel>
      <PanelTitle>Active Calls ({activeCalls.length})</PanelTitle>
      {activeCalls.map((call: TP2PCall) => {
        const remoteName =
          call.direction === "outgoing"
            ? call.calleeName || "Connecting..."
            : call.callerName || "Connecting...";

        return (
          <CallItem key={call.callId} isActive={call.isTalking}>
            <CallInfo>
              <DirectionBadge direction={call.direction}>
                {call.direction === "outgoing" ? "→" : "←"}
              </DirectionBadge>
              <CallName>{remoteName}</CallName>
              <CallState>{call.state}</CallState>
            </CallInfo>
            <CallActions>
              <PTTButton
                isTalking={call.isTalking}
                onMouseDown={() => togglePTT(call.callId, true)}
                onMouseUp={() => togglePTT(call.callId, false)}
                onMouseLeave={() => {
                  if (call.isTalking) togglePTT(call.callId, false);
                }}
                disabled={call.state !== "active"}
              >
                PTT
              </PTTButton>
              <EndButton onClick={() => handleEndCall(call.callId)}>End</EndButton>
            </CallActions>
          </CallItem>
        );
      })}
      {activeReadyCalls.length > 1 && (
        <MasterPTTSection>
          <MasterPTTButton
            isTalking={isMasterTalking}
            onMouseDown={() => toggleAllPTT(true)}
            onMouseUp={() => toggleAllPTT(false)}
            onMouseLeave={() => {
              if (isMasterTalking) toggleAllPTT(false);
            }}
          >
            Talk All
          </MasterPTTButton>
        </MasterPTTSection>
      )}
    </Panel>
  );
}
