import React, { FC } from "react";
import { observer } from "mobx-react-lite";
import { FlatList, ToastAndroid, View, ViewStyle } from "react-native";
import { AppStackScreenProps } from "app/navigators";
import { Header, ListItem, Screen, Text } from "app/components";
import { colors, layout, spacing } from "app/theme";
import { useStores } from "app/models";
import { logout } from "solid-authn-react-native";
import BleManager, {
  BleManagerDidUpdateValueForCharacteristicEvent,
} from "react-native-ble-manager";
import { bleManagerEmitter } from "./BleSelector";
import { bytesToValue } from "./octetstream-codec";
import { Buffer } from "@craftzdog/react-native-buffer";
import { subscriptions } from "./subscriptions";

type ThingsDetailScreenProps = AppStackScreenProps<"ThingsDetail">;

const $flatListContentContainer: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.lg,
};
const $flatListStyle: ViewStyle = {
  paddingHorizontal: spacing.xs,
  backgroundColor: colors.palette.neutral200,
  flex: 1,
};
const { fill } = layout;
const $item: ViewStyle = {
  backgroundColor: colors.palette.neutral100,
  borderRadius: 8,
  padding: spacing.lg,
  marginVertical: spacing.md,
};

export const ThingsDetailScreen: FC<ThingsDetailScreenProps> = observer(
  function ThingsDetailScreen(props) {
    // get the thing's properties actions and events
    const { datasetStore, logStore, thingsStore } = useStores();
    const name = props.route.params.name;
    const thing = thingsStore.getThing(name);
    const properties = Object.keys(thing.properties || {});
    const actions = Object.keys(thing.actions || {});
    const events = Object.keys(thing.events || {});

    const subscribe = async (
      affordance: "events" | "properties" | "actions",
      item: string,
      thingName: string,
    ) => {
      // Make sure device is connected
      const mac = thingsStore.getThing(thingName).id;
      const connectedPeripherals = await BleManager.getConnectedPeripherals();
      if (
        connectedPeripherals.find((peripheral) => peripheral.id === mac) ===
        undefined
      ) {
        await BleManager.connect(mac);
      }

      // Subscribe to the affordance
      const event = thing.events[item];
      const handler = (dataValue) => {
        console.debug("event " + item + " fired with data " + dataValue);
        const logEntry = {
          affordanceName: item,
          timestamp: new Date(),
          dataSchema: event.dataSchema,
          dataValue,
        };
        logStore.addLog(thingName, logEntry, affordance, item);
        datasetStore.addLogEntry(logEntry);
        console.log("added log");
      };
      await BleManager.startNotification(
        mac,
        event.serviceId,
        event.characteristicId,
      );
      console.debug("subscribed to " + item);
      const subscription = bleManagerEmitter.addListener(
        "BleManagerDidUpdateValueForCharacteristic",
        (data: BleManagerDidUpdateValueForCharacteristicEvent) => {
          if (
            data.peripheral !== mac ||
            data.characteristic !== event.characteristicId
          ) {
            return;
          }
          const value = bytesToValue(Buffer.from(data.value), event.dataSchema);
          handler(value);
        },
      );
      subscriptions.push({
        id: `${thingName}-${affordance}-${item}`,
        subscription,
      });
    };

    const unsubscribe = async (item: string) => {
      const subscription = subscriptions.find(
        (sub) => sub.id === `${name}-events-${item}`,
      );
      await BleManager.stopNotification(
        thing.id,
        thing.events[item].serviceId,
        thing.events[item].characteristicId,
      );
      subscription.subscription.remove();
      subscriptions.splice(subscriptions.indexOf(subscription), 1);
      ToastAndroid.show("Unsubscribed from " + item, ToastAndroid.SHORT);
    };

    const read = (item: string) => {
      const char = thing.properties[item].characteristic;
      console.log("read " + item + " with characteristic " + char);
    };

    return (
      <Screen contentContainerStyle={$flatListContentContainer}>
        <Header
          title={name}
          leftIcon="back"
          onLeftPress={() =>
            props.navigation.navigate("Overview", { screen: "Overview" })
          }
          rightTx="common.logOut"
          onRightPress={logout}
        />
        <Text preset="subheading" tx="detailScreen.clickToSubscribe" />
        <View style={[fill, $item]}>
          <Text preset="heading" text="Properties" />
          <FlatList
            data={properties}
            style={$flatListStyle}
            renderItem={({ item, index }) => (
              <ListItem
                onPress={() => read(item)}
                topSeparator={index === 0}
                bottomSeparator
              >
                <Text preset="bold" text={item + "\n"} />
                <Text>
                  readable:{" "}
                  {(thing.properties[item].readable ? "y" : "n") + "\n"}
                </Text>
                <Text>
                  writable:{" "}
                  {(thing.properties[item].writeable ? "y" : "n") + "\n"}
                </Text>
                <Text>
                  observable:{" "}
                  {(thing.properties[item].observable ? "y" : "n") + "\n"}
                </Text>
                <Text>value: {thing.properties[item].value}</Text>
              </ListItem>
            )}
            ListEmptyComponent={<Text tx="detailScreen.noProperties" />}
          />

          <Text preset="heading" text="Actions" />
          <FlatList
            data={actions}
            style={$flatListStyle}
            renderItem={({ item, index }) => (
              <ListItem
                text={item}
                onPress={() => subscribe("actions", item, name)}
                TextProps={{ numberOfLines: 1 }}
                topSeparator={index === 0}
                bottomSeparator
                rightIcon="bell"
              />
            )}
            ListEmptyComponent={<Text tx="detailScreen.noActions" />}
          />

          <Text preset="heading" text="Events" />
          <FlatList
            data={events}
            style={$flatListStyle}
            renderItem={({ item, index }) => (
              <ListItem
                text={item}
                onPress={() => {
                  subscriptions.find(
                    (sub) => sub.id === `${name}-events-${item}`,
                  ) === undefined
                    ? subscribe("events", item, name)
                    : unsubscribe(item);
                }}
                TextProps={{ numberOfLines: 1 }}
                topSeparator={index === 0}
                bottomSeparator
                rightIcon={
                  subscriptions.find(
                    (sub) => sub.id === `${name}-events-${item}`,
                  ) === undefined
                    ? "bell"
                    : "bell_slash"
                }
              />
            )}
            ListEmptyComponent={<Text tx="detailScreen.noEvents" />}
          />
        </View>
      </Screen>
    );
  },
);
