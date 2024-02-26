import React, { FC, useCallback, useState } from "react";
import { TextStyle, ViewStyle } from "react-native";
import useAsyncEffect from "use-async-effect";
import { Button, Screen, Text, TextField } from "../components";
import { AppStackScreenProps } from "../navigators";
import {
  handleIncomingRedirect,
  login,
  getDefaultSession,
} from "solid-authn-react-native";
import { spacing } from "../theme";
import { observer } from "mobx-react-lite";
import { useStores } from "app/models";

type LoginScreenProps = AppStackScreenProps<"Login">;

export const LoginScreen: FC<LoginScreenProps> = observer(
  function LoginScreen(_props) {
    const [webId, setWebId] = useState<string | undefined>();
    const [provider, setProvider] = useState<string>(
      "https://solidcommunity.net/",
    );
    const {
      authenticationStore: { logout, setAuthToken },
    } = useStores();

    const onSessionChanged = useCallback(() => {
      if (getDefaultSession().info.isLoggedIn) {
        const webId = getDefaultSession().info.webId;
        getDefaultSession().onLogout(logout);
        setWebId(webId);
        setAuthToken(webId);
      } else {
        setWebId(undefined);
        setAuthToken(undefined);
      }
    }, [logout, setAuthToken]);

    // Handle Incoming Redirect
    useAsyncEffect(async () => {
      await handleIncomingRedirect({
        restorePreviousSession: true,
      });
      onSessionChanged();
    }, [onSessionChanged]);

    // Login
    const onLoginPress = useCallback(
      async (issuer: string) => {
        await login({
          oidcIssuer: issuer,
          redirectUrl: "https://wearable-wot.web.app",
          clientName: "My application",
          tokenType: "Bearer",
        });
        onSessionChanged();
      },
      [onSessionChanged],
    );

    return (
      <Screen
        preset="auto"
        contentContainerStyle={$screenContentContainer}
        safeAreaEdges={["top", "bottom"]}
      >
        <Text
          testID="login-heading"
          tx="loginScreen.signIn"
          preset="heading"
          style={$signIn}
        />
        <Text
          tx="loginScreen.enterDetails"
          preset="subheading"
          style={$enterDetails}
        />

        <TextField
          value={provider}
          onChangeText={setProvider}
          containerStyle={$textField}
          autoCapitalize="none"
          autoComplete="url"
          autoCorrect={false}
          keyboardType="url"
          labelTx="loginScreen.solidProvider"
          placeholderTx="loginScreen.solidProviderPlaceholder"
          onSubmitEditing={() => onLoginPress(provider)}
        />

        <Button
          testID="login-button"
          tx="loginScreen.tapToSignIn"
          style={$tapButton}
          preset="reversed"
          onPress={() => {
            if (__DEV__) {
              setWebId("https://derwehr.solidcommunity.net/profile/card#me");
              setAuthToken(webId);
            } else {
              onLoginPress(provider);
            }
          }}
        />
      </Screen>
    );
  },
);

const $screenContentContainer: ViewStyle = {
  paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
};

const $signIn: TextStyle = {
  marginBottom: spacing.sm,
};

const $enterDetails: TextStyle = {
  marginBottom: spacing.lg,
};

const $textField: ViewStyle = {
  marginBottom: spacing.lg,
};

const $tapButton: ViewStyle = {
  marginTop: spacing.xs,
};
