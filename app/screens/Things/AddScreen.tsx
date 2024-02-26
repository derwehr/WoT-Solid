import React, { FC } from "react";
import { Alert, View, ViewStyle } from "react-native";
import { AppStackScreenProps } from "app/navigators";
import { Button, Header, Screen, Text, TextField } from "app/components";
import { colors, layout, spacing } from "../../theme";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { AvoidSoftInput } from "react-native-avoid-softinput";
import { useFocusEffect } from "@react-navigation/native";

const $screenContainer: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.lg,
};
const $item: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.lg,
  marginVertical: spacing.md,
};
const { fill, m1 } = layout;

type AddThingScreenProps = AppStackScreenProps<"AddThing">;

export const AddThingScreen: FC<AddThingScreenProps> = function AddThingScreen(
  _props,
) {
  const [td, setTd] = React.useState(
    "Enter a TD here or get them from one of the sources above",
  );
  const [name, setName] = React.useState("Enter a name here");
  const { navigation } = _props;

  const onFocusEffect = React.useCallback(() => {
    // react-native-avoid-softinput doesn't work in dev mode
    if (!__DEV__) {
      // This should be run when screen gains focus - enable the module where it's needed
      AvoidSoftInput.setShouldMimicIOSBehavior(true);
      AvoidSoftInput.setEnabled(true);
      return () => {
        // This should be run when screen loses focus - disable the module where it's not needed, to make a cleanup
        AvoidSoftInput.setEnabled(false);
        AvoidSoftInput.setShouldMimicIOSBehavior(false);
      };
    }
  }, []);

  useFocusEffect(onFocusEffect); // register callback to focus events

  const handleGetFromFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
    });
    if (!result.canceled) {
      const { uri } = result.assets[0];
      const file = await FileSystem.readAsStringAsync(uri);
      setTd(file);
    }
  };

  const handleGetFromUrl = () => {
    // TODO
    console.log("Add from url");
  };

  const addThingHandler = async () => {
    if (td.length === 0) {
      Alert.alert("Please enter a TD first");
      return;
    }
    if (name.length === 0) {
      Alert.alert("Please enter a name first");
      return;
    }
    const tdJson = JSON.parse(td);
    tdJson.id = name;
    navigation.navigate("BleSelector", { name, td: tdJson });
  };

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      contentContainerStyle={$screenContainer}
    >
      <Header
        titleTx="thingsScreen.addThing"
        leftIcon="back"
        onLeftPress={() =>
          navigation.navigate("Overview", { screen: "Overview" })
        }
      />
      <View style={[$item, fill]}>
        <View style={fill}>
          <Text tx="thingsScreen.addThing1" />
          <Button
            tx="thingsScreen.getFromFile"
            onPress={handleGetFromFile}
            style={m1}
          />
          <Button
            tx="thingsScreen.getFromUrl"
            onPress={handleGetFromUrl}
            style={m1}
          />
          <TextField
            multiline
            numberOfLines={14}
            value={td}
            onChangeText={setTd}
            containerStyle={[fill, m1]}
          />
        </View>
        <View>
          <TextField
            labelTx="thingsScreen.addThing2"
            value={name}
            onChangeText={setName}
            containerStyle={m1}
          />
        </View>
        <View>
          <Button
            tx="thingsScreen.addThing"
            onPress={addThingHandler}
            style={m1}
          />
        </View>
      </View>
    </Screen>
  );
};
