import styled from "@emotion/styled";
import { useGlobalState } from "../../global-state/context-provider";
import { useP2PCalls } from "../../hooks/use-p2p-calls";
import { getClientId } from "../../api/auth";

const Panel = styled.div`
  background: #23292c;
  border-radius: 0.8rem;
  padding: 1.5rem;
  border: 0.1rem solid rgba(109, 109, 109, 0.3);
`;

const PanelTitle = styled.h3`
  font-size: 1.4rem;
  color: rgba(89, 203, 232, 1);
  margin: 0 0 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 0.1rem solid rgba(109, 109, 109, 0.3);
  font-weight: 600;
`;

const ClientItem = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.6rem 0;
  border-bottom: 0.1rem solid rgba(109, 109, 109, 0.15);

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const OnlineIndicator = styled.span`
  display: inline-block;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: #1db954;
  margin-right: 0.6rem;
  flex-shrink: 0;
  margin-top: 0.3rem;
`;

const ClientNameRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`;

const ClientName = styled.span`
  color: white;
  font-weight: 600;
  font-size: 1.3rem;
  line-height: 1.3;
  display: flex;
  align-items: flex-start;
`;

const ClientMeta = styled.span`
  color: #aaa;
  font-size: 1.1rem;
  margin-top: 0.2rem;
  padding-left: 1.3rem;
`;

const EmptyState = styled.p`
  color: #666;
  font-size: 1.3rem;
  text-align: center;
  padding: 1rem 0 0.25rem;
  margin: 0;
`;

const CallButton = styled.button`
  background: rgba(89, 203, 232, 0.2);
  color: rgba(89, 203, 232, 1);
  border: 0.1rem solid rgba(89, 203, 232, 0.4);
  border-radius: 0.4rem;
  padding: 0.2rem 0.8rem;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  margin-left: auto;
  flex-shrink: 0;

  &:hover {
    background: rgba(89, 203, 232, 0.3);
  }
`;

const TalkingIndicator = styled.span`
  color: #1db954;
  font-size: 1rem;
  font-weight: 600;
  margin-left: 0.6rem;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

export function ClientList({
  audioStream,
  audioOutput,
}: {
  audioStream?: MediaStream | null;
  audioOutput?: string;
}) {
  const [{ onlineClients, activeTalkers }] = useGlobalState();
  const { initiateCall } = useP2PCalls();
  const myClientId = getClientId();

  return (
    <Panel>
      <PanelTitle>Online Clients ({onlineClients.length})</PanelTitle>
      {onlineClients.length === 0 ? (
        <EmptyState>No other clients online</EmptyState>
      ) : (
        onlineClients.map((client) => (
          <ClientItem key={client.clientId}>
            <ClientNameRow>
              <ClientName>
                <OnlineIndicator />
                {client.name}
                {activeTalkers[client.clientId] && (
                  <TalkingIndicator>Talking</TalkingIndicator>
                )}
              </ClientName>
              {client.clientId !== myClientId && (
                <CallButton
                  onClick={() =>
                    initiateCall(
                      client.clientId,
                      audioStream ?? null,
                      audioOutput
                    )
                  }
                >
                  Call
                </CallButton>
              )}
            </ClientNameRow>
            <ClientMeta>
              {client.role} &mdash; {client.location}
            </ClientMeta>
          </ClientItem>
        ))
      )}
    </Panel>
  );
}
