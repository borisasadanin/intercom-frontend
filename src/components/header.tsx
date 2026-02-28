import styled from "@emotion/styled";
import { FC, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HeadsetIcon } from "../assets/icons/icon.tsx";
import { backgroundColour } from "../css-helpers/defaults.ts";
import { mediaQueries } from "./generic-components.ts";
import { useGlobalState } from "../global-state/context-provider.tsx";
import { useAudioCue } from "./production-line/use-audio-cue.ts";
import { ConfirmationModal } from "./verify-decision/confirmation-modal.tsx";

const HeaderWrapper = styled.div`
  width: 100%;
  background: ${backgroundColour};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
`;

const StatusDot = styled.span<{ connected: boolean }>`
  display: inline-block;
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: ${(p) => (p.connected ? "#1db954" : "#cc3333")};
  margin-right: 0.4rem;
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  color: #aaa;
  margin-left: auto;
  padding-right: 1.5rem;
`;

const HomeButton = styled.button`
  background: ${backgroundColour};
  border: none;
  padding: 1rem;
  display: flex;
  align-items: center;
  width: fit-content;
  font-size: 3rem;
  font-weight: semi-bold;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.87);

  svg {
    width: 2.4rem;
    height: 2.4rem;
    margin-right: 1rem;
    margin-left: 1rem;
    fill: #59cbe8;
  }

  ${mediaQueries.isSmallScreen} {
    font-size: 2rem;

    svg {
      width: 2rem;
      height: 2rem;
    }
  }
`;

export const Header: FC = () => {
  const [confirmExitModalOpen, setConfirmExitModalOpen] = useState(false);
  const [{ calls, wsSendMessage }, dispatch] = useGlobalState();
  const isConnected = wsSendMessage !== null;
  const navigate = useNavigate();
  const location = useLocation();
  const { playExitSound } = useAudioCue();
  const isEmpty = Object.values(calls).length === 0;

  const runExitAllCalls = () => {
    setConfirmExitModalOpen(false);
    navigate("/");
    playExitSound();
    if (!isEmpty) {
      Object.entries(calls).forEach(([callId]) => {
        if (callId) {
          dispatch({
            type: "REMOVE_CALL",
            payload: { id: callId },
          });
        }
      });
    }
  };

  const returnToRoot = () => {
    if (location.pathname.includes("/line") && isEmpty) {
      runExitAllCalls();
    } else if (location.pathname.includes("/line")) {
      setConfirmExitModalOpen(true);
    } else {
      navigate("/");
    }
  };

  return (
    <>
      <HeaderWrapper>
        <HomeButton onClick={returnToRoot}>
          <HeadsetIcon />
          Open Intercom
        </HomeButton>
        <ConnectionStatus>
          <StatusDot connected={isConnected} />
          {isConnected ? "Connected" : "Disconnected"}
        </ConnectionStatus>
      </HeaderWrapper>
      {confirmExitModalOpen && (
        <ConfirmationModal
          title="Confirm"
          description="Are you sure you want to leave all calls?"
          confirmationText="This will leave all calls and return to the home page."
          onCancel={() => setConfirmExitModalOpen(false)}
          onConfirm={runExitAllCalls}
        />
      )}
    </>
  );
};
