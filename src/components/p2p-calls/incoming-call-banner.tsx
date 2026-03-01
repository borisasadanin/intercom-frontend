import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { TP2PCall } from "../../global-state/types";

const pulseDot = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.3);
  }
`;

const BannerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 150;
  pointer-events: none;
`;

const BannerItem = styled.div`
  background: rgba(29, 185, 84, 0.15);
  border-bottom: 0.2rem solid #1db954;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  pointer-events: auto;
  backdrop-filter: blur(1rem);
`;

const PulsingDot = styled.div`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #1db954;
  flex-shrink: 0;
  animation: ${pulseDot} 1.5s infinite;
`;

const CallerInfo = styled.span`
  color: white;
  font-size: 1.4rem;
  font-weight: 600;
`;

const CallerRole = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.1rem;
  margin-left: 0.5rem;
  font-weight: 400;
`;

export function IncomingCallBanner({
  pendingCalls,
}: {
  pendingCalls: TP2PCall[];
}) {
  if (pendingCalls.length === 0) return null;

  return (
    <BannerContainer>
      {pendingCalls.map((call) => (
        <BannerItem key={call.callId}>
          <PulsingDot />
          <CallerInfo>
            {call.callerName || "Unknown"}
            <CallerRole>ringer dig</CallerRole>
          </CallerInfo>
        </BannerItem>
      ))}
    </BannerContainer>
  );
}
