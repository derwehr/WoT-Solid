import React, { FC, useState } from "react";
import { observer } from "mobx-react-lite";
import { FlatList, ToastAndroid, View, ViewStyle } from "react-native";
import { AppStackScreenProps } from "app/navigators";
import { Button, Header, ListItem, Screen, Text } from "app/components";
import { colors, spacing, layout } from "../../theme";
import { useStores } from "../../models";
import { logout } from "solid-authn-react-native";

const $flatListContentContainer: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.lg,
};

const $flatListStyle: ViewStyle = {
  paddingHorizontal: spacing.xs,
  backgroundColor: colors.palette.neutral200,
  flex: 1,
};

const $item: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  marginVertical: spacing.md,
};

const { fill, center } = layout;

type LogScreenProps = AppStackScreenProps<"Log">;

export const LogScreen: FC<LogScreenProps> = observer(
  function LogScreen(props) {
    const { datasetStore, logStore } = useStores();
    const [selectedThing, setSelectedThing] = useState(null);
    const [started, setStarted] = useState(false);

    let mockInterval = null;
    const toggleMockInterval = () => {
      if (!logStore.things().includes("mockThing")) {
        mockInterval = setInterval(() => {
          const logEntry = {
            affordanceName: "mockEvent",
            timestamp: new Date(),
            dataSchema: {
              "ssn:forProperty": "https://w3id.org/seas/TemperatureProperty",
              unit: "http://qudt.org/1.1/vocab/unit#DEG_C",
            },
            dataValue: 15 + Math.random() * 15,
          };
          logStore.addLog("mockThing", logEntry, "events", "mockEvent");
          datasetStore.addLogEntry(logEntry);
        }, 1000);
        console.debug("mock interval started");
      } else {
        clearInterval(mockInterval);
        mockInterval = null;
        console.debug("mock interval stopped");
      }
    };

    const startRecording = () => {
      setStarted(true);

      datasetStore.clear();
      logStore.clearAllLogs();
    };

    const stopRecording = async () => {
      const success = await datasetStore.saveDataset();
      setStarted(false);
      if (success) {
        ToastAndroid.show("Recording saved", ToastAndroid.SHORT);
      } else {
        ToastAndroid.show("Failed to save recording", ToastAndroid.SHORT);
      }
    };

    return (
      <Screen
        contentContainerStyle={$flatListContentContainer}
        safeAreaEdges={["top"]}
      >
        <Header
          title="Log"
          rightTx="common.logOut"
          onRightPress={logout}
          leftIcon={selectedThing === null ? undefined : "back"}
          onLeftPress={
            selectedThing === null ? undefined : () => setSelectedThing(null)
          }
        />
        <View style={[fill, $item]}>
          {selectedThing === null ? (
            logStore.things().length > 0 ? (
              <FlatList
                data={logStore.things()}
                style={$flatListStyle}
                renderItem={({ item, index }) => (
                  <ListItem
                    text={item}
                    onPress={() => {
                      setSelectedThing(item);
                    }}
                    topSeparator={index === 0}
                    bottomSeparator
                    rightIcon="caretRight"
                  />
                )}
              />
            ) : (
              <Text tx="log.noThings" style={center} />
            )
          ) : (
            <>
              <Text preset="bold" text="Property Observations" />
              <FlatList
                data={logStore.getPropertyNames(selectedThing)}
                style={$flatListStyle}
                renderItem={({ item, index }) => (
                  <ListItem
                    text={item}
                    topSeparator={index === 0}
                    bottomSeparator
                  />
                )}
              />
              <Text preset="bold" text="Action Observations" />
              <FlatList
                data={logStore.getActionNames(selectedThing)}
                style={$flatListStyle}
                renderItem={({ item, index }) => (
                  <ListItem
                    text={item}
                    topSeparator={index === 0}
                    bottomSeparator
                  />
                )}
              />
              <Text preset="bold" text="Event Observations" />
              <FlatList
                data={logStore.getEventNames(selectedThing)}
                style={$flatListStyle}
                renderItem={({ item, index }) => (
                  <ListItem
                    text={item}
                    topSeparator={index === 0}
                    bottomSeparator
                    onPress={() => {
                      props.navigation.navigate("Visualizations", {
                        affordanceName: item,
                        affordanceType: "events",
                        thingName: selectedThing,
                      });
                    }}
                  />
                )}
              />
            </>
          )}
          {selectedThing === null && (
            <>
              <Button
                text={started ? "save log" : "start new recording"}
                onPress={() => {
                  if (!started) {
                    startRecording();
                  } else {
                    stopRecording();
                  }
                }}
              />
              {__DEV__ && (
                <>
                  <Button
                    text={
                      logStore.things().includes("mockThing")
                        ? "create mock log"
                        : "stop mock log"
                    }
                    onPress={() => {
                      toggleMockInterval();
                    }}
                  />
                  <Button
                    text="clear log"
                    onPress={() => {
                      logStore.clearAllLogs();
                      datasetStore.clear();
                    }}
                  />
                </>
              )}
            </>
          )}
        </View>
      </Screen>
    );
  },
);
