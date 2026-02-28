import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "@emotion/styled";
import { API } from "../../api/api";
import { getClientId, isAuthenticated, setAuth } from "../../api/auth";
import { useGlobalState } from "../../global-state/context-provider";
import { useStatusWebSocket } from "../../hooks/use-status-websocket";
import {
  FormInput,
  PrimaryButton,
} from "../form-elements/form-elements";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: #32383b;
  color: white;
`;

const FormCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  width: 100%;
  max-width: 40rem;
  padding: 3rem;
  background: #23292c;
  border-radius: 0.8rem;
  border: 0.1rem solid rgba(109, 109, 109, 0.3);
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0 0 2rem;
  text-align: center;
  color: rgba(89, 203, 232, 1);
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 1.2rem;
  color: #aaa;
  margin-bottom: 0.4rem;
  margin-top: 0;
`;

const FieldWrapper = styled.div`
  margin-bottom: 0.5rem;
`;

const StyledFormInput = styled(FormInput)`
  margin: 0 0 0.5rem;
`;

const ErrorText = styled.p`
  color: #f96c6c;
  font-size: 1.4rem;
  text-align: center;
  margin: 0.5rem 0 1rem;
`;

const RegisterButton = styled(PrimaryButton)`
  width: 100%;
  justify-content: center;
  margin-top: 1rem;
  font-size: 1.6rem;
`;

const LoadingText = styled.p`
  text-align: center;
  color: #aaa;
  font-size: 1.4rem;
`;

const NAME_KEY = "intercom2_name";
const ROLE_KEY = "intercom2_role";
const LOCATION_KEY = "intercom2_location";

export function RegistrationPage() {
  const [, dispatch] = useGlobalState();
  const navigate = useNavigate();
  const { connect } = useStatusWebSocket();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRegistering, setAutoRegistering] = useState(false);

  async function doRegister(
    regName: string,
    regRole: string,
    regLocation: string,
    existingClientId?: string
  ) {
    setLoading(true);
    setError("");
    try {
      const response = await API.registerClient({
        name: regName,
        role: regRole,
        location: regLocation,
        existingClientId,
      });

      if (response && response.clientId && response.token) {
        setAuth(response.token, response.clientId);
        localStorage.setItem(NAME_KEY, response.name);
        localStorage.setItem(ROLE_KEY, response.role);
        localStorage.setItem(LOCATION_KEY, response.location);
        dispatch({ type: "SET_REGISTERED", payload: true });
        connect();
        navigate("/");
      } else {
        setError("Registration failed. Please try again.");
      }
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-re-register if already has stored credentials + metadata
  useEffect(() => {
    if (isAuthenticated()) {
      const existingClientId = getClientId();
      const storedName = localStorage.getItem(NAME_KEY);
      const storedRole = localStorage.getItem(ROLE_KEY);
      const storedLocation = localStorage.getItem(LOCATION_KEY);

      if (existingClientId && storedName && storedRole && storedLocation) {
        setAutoRegistering(true);
        doRegister(storedName, storedRole, storedLocation, existingClientId);
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !role.trim() || !location.trim()) {
      setError("All fields are required.");
      return;
    }
    const existingClientId = getClientId() ?? undefined;
    doRegister(name.trim(), role.trim(), location.trim(), existingClientId);
  }

  if (autoRegistering) {
    return (
      <PageContainer>
        <FormCard>
          <Title>Intercom2</Title>
          <LoadingText>Reconnecting...</LoadingText>
        </FormCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <FormCard>
        <Title>Intercom2 Registration</Title>
        <form onSubmit={handleSubmit}>
          <FieldWrapper>
            <FieldLabel htmlFor="reg-name">Name</FieldLabel>
            <StyledFormInput
              id="reg-name"
              type="text"
              placeholder="e.g. Studio A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              required
              disabled={loading}
            />
          </FieldWrapper>
          <FieldWrapper>
            <FieldLabel htmlFor="reg-role">Role</FieldLabel>
            <StyledFormInput
              id="reg-role"
              type="text"
              placeholder="e.g. Producer, Reporter"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              maxLength={100}
              required
              disabled={loading}
            />
          </FieldWrapper>
          <FieldWrapper>
            <FieldLabel htmlFor="reg-location">Location</FieldLabel>
            <StyledFormInput
              id="reg-location"
              type="text"
              placeholder="e.g. Stockholm"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
              required
              disabled={loading}
            />
          </FieldWrapper>
          {error && <ErrorText>{error}</ErrorText>}
          <RegisterButton type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </RegisterButton>
        </form>
      </FormCard>
    </PageContainer>
  );
}
