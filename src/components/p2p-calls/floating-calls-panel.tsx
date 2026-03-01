import { useState } from "react";
import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { useGlobalState } from "../../global-state/context-provider";
import { ActiveCallsPanel } from "./active-calls-panel";
import { TP2PCall } from "../../global-state/types";

const FloatingContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 100;
  width: 32rem;
  box-shadow: 0 0.4rem 2rem rgba(0, 0, 0, 0.5);
  border-radius: 1rem;
  overflow: hidden;
`;

const FloatingHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: #1a1f22;
  padding: 0.8rem 1.2rem;
  cursor: pointer;
  user-select: none;
`;

const HeaderTitle = styled.span`
  color: white;
  font-weight: 600;
  font-size: 1.3rem;
`;

const MinimizeButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.2rem;

  &:hover {
    color: rgba(89, 203, 232, 1);
  }
`;

const pulseAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const MinimizedBadge = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 100;
  width: 4.8rem;
  height: 4.8rem;
  border-radius: 50%;
  background: #cc3333;
  color: white;
  font-weight: 700;
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0.4rem 1.2rem rgba(0, 0, 0, 0.5);
  animation: ${pulseAnimation} 2s infinite;

  &:hover {
    background: #b52b2b;
  }
`;

export function FloatingCallsPanel() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [{ audioStream, userSettings, wsSendMessage, p2pCalls }] =
    useGlobalState();

  const activeCalls = p2pCalls.filter((c: TP2PCall) => c.state !== "ended");

  if (activeCalls.length === 0) return null;

  if (isMinimized) {
    return (
      <MinimizedBadge onClick={() => setIsMinimized(false)}>
        {activeCalls.length}
      </MinimizedBadge>
    );
  }

  return (
    <FloatingContainer>
      <FloatingHeader onClick={() => setIsMinimized(true)}>
        <HeaderTitle>Active Calls ({activeCalls.length})</HeaderTitle>
        <MinimizeButton>−</MinimizeButton>
      </FloatingHeader>
      <ActiveCallsPanel
        audioStream={audioStream}
        audioOutput={userSettings?.audiooutput}
        sendWsMessage={wsSendMessage ?? undefined}
      />
    </FloatingContainer>
  );
}
