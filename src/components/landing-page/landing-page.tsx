import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { ProductionsListContainer } from "./productions-list-container.tsx";
import { useGlobalState } from "../../global-state/context-provider.tsx";
import { UserSettings } from "../user-settings/user-settings.tsx";
import { UserSettingsButton } from "./user-settings-button.tsx";
import { TUserSettings } from "../user-settings/types.ts";
import { isMobile } from "../../bowser.ts";
import { ClientList } from "../client-registry/client-list.tsx";

const LandingLayout = styled.div`
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  padding: 0 2rem 2rem;
`;

const MainContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const Sidebar = styled.div`
  flex: 0 0 26rem;
  padding-top: 1rem;

  @media (max-width: 768px) {
    display: none;
  }
`;

export const LandingPage = ({ setApiError }: { setApiError: () => void }) => {
  const [{ apiError, userSettings }, dispatch] = useGlobalState();
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (apiError) {
      setApiError();
    }
  }, [apiError, setApiError]);

  useEffect(() => {
    const constraints: MediaStreamConstraints = {
      audio: userSettings?.audioinput
        ? { deviceId: { exact: userSettings.audioinput } }
        : true,
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        setAudioStream(stream);
        dispatch({ type: "SET_AUDIO_STREAM", payload: { stream } });
      })
      .catch(() => {
        setAudioStream(null);
        dispatch({ type: "SET_AUDIO_STREAM", payload: { stream: null } });
      });

    // Don't stop tracks on cleanup — they are shared with active calls
  }, [userSettings?.audioinput]);

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
          <LandingLayout>
            <MainContent>
              <ProductionsListContainer />
            </MainContent>
            <Sidebar>
              <ClientList
                audioStream={audioStream}
                audioOutput={userSettings?.audiooutput}
              />
            </Sidebar>
          </LandingLayout>
        </>
      )}
    </div>
  );
};
