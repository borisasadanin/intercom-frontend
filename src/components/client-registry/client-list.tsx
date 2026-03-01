import styled from "@emotion/styled";
import { useMemo, useState } from "react";
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

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  font-size: 1.3rem;
  padding: 0.55rem 0.8rem;
  margin-bottom: 0.75rem;
  border: 0.1rem solid #6d6d6d;
  border-radius: 0.4rem;
  background: #32383b;
  color: white;

  &::placeholder {
    color: #888;
  }

  &:focus {
    outline: none;
    border-color: rgba(89, 203, 232, 0.6);
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
`;

const FilterSelect = styled.select`
  flex: 1;
  font-size: 1.2rem;
  padding: 0.45rem 0.6rem;
  border: 0.1rem solid #6d6d6d;
  border-radius: 0.4rem;
  background: #32383b;
  color: white;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;

  &:focus {
    outline: none;
    border-color: rgba(89, 203, 232, 0.6);
  }
`;

const ResultCount = styled.p`
  color: rgba(89, 203, 232, 0.8);
  font-size: 1.1rem;
  margin: 0 0 0.6rem;
  padding: 0;
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

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");

  const uniqueRoles = useMemo(
    () => Array.from(new Set(onlineClients.map((c) => c.role).filter(Boolean))).sort(),
    [onlineClients]
  );

  const uniqueLocations = useMemo(
    () =>
      Array.from(new Set(onlineClients.map((c) => c.location).filter(Boolean))).sort(),
    [onlineClients]
  );

  const filteredClients = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return onlineClients.filter((client) => {
      const matchesSearch =
        query === "" || client.name.toLowerCase().startsWith(query);
      const matchesRole = roleFilter === "" || client.role === roleFilter;
      const matchesLocation =
        locationFilter === "" || client.location === locationFilter;
      return matchesSearch && matchesRole && matchesLocation;
    });
  }, [onlineClients, searchQuery, roleFilter, locationFilter]);

  const filtersActive =
    searchQuery !== "" || roleFilter !== "" || locationFilter !== "";

  return (
    <Panel>
      <PanelTitle>Online Clients ({onlineClients.length})</PanelTitle>
      <SearchInput
        type="text"
        placeholder="Sök klient..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <FilterRow>
        <FilterSelect
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">Alla roller</option>
          {uniqueRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          <option value="">Alla platser</option>
          {uniqueLocations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </FilterSelect>
      </FilterRow>
      {filtersActive && (
        <ResultCount>
          {filteredClients.length} av {onlineClients.length} klienter
        </ResultCount>
      )}
      {filteredClients.length === 0 ? (
        <EmptyState>
          {onlineClients.length === 0
            ? "No other clients online"
            : "Inga klienter matchar sökningen"}
        </EmptyState>
      ) : (
        filteredClients.map((client) => (
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
