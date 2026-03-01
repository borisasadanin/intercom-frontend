import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { ProductionsListContainer } from "./productions-list-container.tsx";
import { useGlobalState } from "../../global-state/context-provider.tsx";
import { UserSettings } from "../user-settings/user-settings.tsx";
import { UserSettingsButton } from "./user-settings-button.tsx";
import { TUserSettings } from "../user-settings/types.ts";
import { isMobile } from "../../bowser.ts";

const PageContent = styled.div`
  padding: 0 2rem 2rem;
`;

export const LandingPage = ({ setApiError }: { setApiError: () => void }) => {
  const [{ apiError, userSettings }, dispatch] = useGlobalState();
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    if (apiError) {
      setApiError();
    }
  }, [apiError, setApiError]);

  // Acquire audio stream and store in global state for P2P calls
  useEffect(() => {
    const constraints: MediaStreamConstraints = {
      audio: userSettings?.audioinput
        ? { deviceId: { exact: userSettings.audioinput } }
        : true,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        dispatch({ type: "SET_AUDIO_STREAM", payload: { stream } });
      })
      .catch(() => {
        dispatch({ type: "SET_AUDIO_STREAM", payload: { stream: null } });
      });

    // Don't stop tracks on cleanup — they are shared with active calls
  }, [userSettings?.audioinput, dispatch]);

  const isUserSettingsComplete = (settings: TUserSettings | null) => {
    return (
      settings &&
      settings.username &&
      (settings.audioinput || settings.audiooutput)
    );
  };

  return (
    <div>
      {((showSettings || !isUserSettingsComplete(userSettings)) && (
        <UserSettings
          buttonText={showSettings ? "Save" : "Next"}
          className={isMobile ? "" : "desktop"}
          onSave={() => setShowSettings(false)}
          showBackButton={showSettings}
          onBack={() => setShowSettings(false)}
        />
      )) || (
        <>
          <UserSettingsButton onClick={() => setShowSettings(!showSettings)} />
          <PageContent>
            <ProductionsListContainer />
          </PageContent>
        </>
      )}
    </div>
  );
};
