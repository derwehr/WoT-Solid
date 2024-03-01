import React, { FC, useEffect, useState } from "react";
import {
  FlatList,
  NativeModules,
  NativeEventEmitter,
  PermissionsAndroid,
  Platform,
  View,
  ViewStyle,
} from "react-native";
import { AppStackScreenProps } from "app/navigators";
import BleManager, {
  BleDisconnectPeripheralEvent,
  BleManagerDidUpdateValueForCharacteristicEvent,
  BleScanCallbackType,
  BleScanMatchMode,
  BleScanMode,
  Characteristic,
  Peripheral,
} from "react-native-ble-manager";
import { Button, Header, ListItem, Screen, Text } from "../../components";
import { colors, spacing, layout } from "../../theme";
import { observer } from "mobx-react-lite";
import { useStores } from "app/models";
import { DataSchema, Form, ThingDescription } from "wot-typescript-definitions";

const SECONDS_TO_SCAN_FOR = 7;
const SERVICE_UUIDS: string[] = [];
const ALLOW_DUPLICATES = true;

const BleManagerModule = NativeModules.BleManager;
export const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

declare module "react-native-ble-manager" {
  // enrich local contract with custom state properties needed by App.tsx
  interface Peripheral {
    connected?: boolean;
    connecting?: boolean;
  }
}

export interface BleThing {
  id: string;
  properties: {
    [key: string]: {
      characteristic: string;
      observable: boolean;
      writeable: boolean;
      readable: boolean;
      value: any;
    };
  };
  actions: {
    [key: string]: {
      form: Form[];
    };
  };
  events: {
    [key: string]: {
      dataSchema: DataSchema;
      characteristicId: string;
      serviceId: string;
    };
  };
}

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

type BleSelectorProps = AppStackScreenProps<"BleSelector">;

export const BleSelector: FC<BleSelectorProps> = observer(
  function BleSelector(props) {
    const [isScanning, setIsScanning] = useState(false);
    const [peripherals, setPeripherals] = useState(
      new Map<Peripheral["id"], Peripheral>(),
    );
    const thingsStore = useStores().thingsStore;
    const { navigation } = props;

    const addOrUpdatePeripheral = (
      id: string,
      updatedPeripheral: Peripheral,
    ) => {
      // new Map() enables changing the reference & refreshing UI.
      // TOFIX not efficient.
      setPeripherals((map) => new Map(map.set(id, updatedPeripheral)));
    };

    const startScan = async () => {
      if (!isScanning) {
        // Make sure BLE is enabled
        try {
          await BleManager.enableBluetooth();
        } catch (error) {
          console.error("[startScan] error enabling bluetooth", error);
          return;
        }

        // reset found peripherals before scan
        setPeripherals(new Map<Peripheral["id"], Peripheral>());

        try {
          console.debug("[startScan] starting scan...");
          setIsScanning(true);
          BleManager.scan(
            SERVICE_UUIDS,
            SECONDS_TO_SCAN_FOR,
            ALLOW_DUPLICATES,
            {
              matchMode: BleScanMatchMode.Sticky,
              scanMode: BleScanMode.LowLatency,
              callbackType: BleScanCallbackType.AllMatches,
            },
          )
            .then(() => {
              console.debug("[startScan] scan promise returned successfully.");
            })
            .catch((err) => {
              console.error("[startScan] ble scan returned in error", err);
            });
        } catch (error) {
          console.error("[startScan] ble scan error thrown", error);
        }
      } else {
        BleManager.stopScan().then(handleStopScan).catch(console.error);
      }
    };

    const handleStopScan = () => {
      setIsScanning(false);
      console.debug("[handleStopScan] scan is stopped.");
    };

    const handleDisconnectedPeripheral = (
      event: BleDisconnectPeripheralEvent,
    ) => {
      const peripheral = peripherals.get(event.peripheral);
      if (peripheral) {
        console.debug(
          `[handleDisconnectedPeripheral][${peripheral.id}] previously connected peripheral is disconnected.`,
          event.peripheral,
        );
        addOrUpdatePeripheral(peripheral.id, {
          ...peripheral,
          connected: false,
        });
      }
      console.debug(
        `[handleDisconnectedPeripheral][${event.peripheral}] disconnected.`,
      );
    };

    const handleUpdateValueForCharacteristic = (
      data: BleManagerDidUpdateValueForCharacteristicEvent,
    ) => {
      console.debug(
        `[handleUpdateValueForCharacteristic] received data from '${data.peripheral}' with characteristic='${data.characteristic}' and value='${data.value}'`,
      );
    };

    const handleDiscoverPeripheral = (peripheral: Peripheral) => {
      console.debug(
        "[handleDiscoverPeripheral] new BLE peripheral=",
        peripheral,
      );
      if (!peripheral.name) {
        peripheral.name = "NO NAME";
      }
      addOrUpdatePeripheral(peripheral.id, peripheral);
    };

    const togglePeripheralConnection = async (peripheral: Peripheral) => {
      if (peripheral && peripheral.connected) {
        try {
          await BleManager.disconnect(peripheral.id);
        } catch (error) {
          console.error(
            `[togglePeripheralConnection][${peripheral.id}] error when trying to disconnect device.`,
            error,
          );
        }
      } else {
        await connectPeripheral(peripheral);
      }
    };

    const createBleThing = (
      id: string,
      td: ThingDescription,
      characteristics: Characteristic[],
    ): BleThing => {
      const bleThing: BleThing = {
        id: id,
        properties: {},
        actions: {},
        events: {},
      };
      if (td.properties !== undefined) {
        for (const [key, value] of Object.entries(td.properties)) {
          let { characteristicId } = deconstructForm(value.forms);
          // convert to short id
          const shortId = characteristicId.substring(4, 8);
          characteristics.find((c) => {
            return (
              c.characteristic === characteristicId ||
              c.characteristic === shortId
            );
          }).characteristic;
          bleThing.properties[key] = {
            observable: value.observable || false,
            writeable: value.writeOnly || !value.readOnly || false,
            readable: value.readOnly || !value.writeOnly || false,
            characteristic: characteristicId,
            value: undefined,
          };
        }
      }
      if (td.events !== undefined) {
        for (const [key, value] of Object.entries(td.events)) {
          const { characteristicId, serviceId } = deconstructForm(value.forms);
          const dataSchema = value.data ?? value;

          bleThing.events[key] = {
            dataSchema,
            characteristicId,
            serviceId,
          };
        }
      }
      return bleThing;
    };

    const connectPeripheral = async (peripheral: Peripheral) => {
      if (peripheral) {
        addOrUpdatePeripheral(peripheral.id, {
          ...peripheral,
          connecting: true,
        });

        await BleManager.connect(peripheral.id);
        console.debug(`[connectPeripheral][${peripheral.id}] connected.`);

        addOrUpdatePeripheral(peripheral.id, {
          ...peripheral,
          connecting: false,
          connected: true,
        });

        // before retrieving services, it is often a good idea to let bonding & connection finish properly
        await sleep(900);

        /* Test read current RSSI value, retrieve services first */
        const peripheralData = await BleManager.retrieveServices(peripheral.id);
        console.debug(
          `[connectPeripheral][${peripheral.id}] retrieved peripheral services`,
          peripheralData,
        );

        const rssi = await BleManager.readRSSI(peripheral.id);
        console.debug(
          `[connectPeripheral][${peripheral.id}] retrieved current RSSI value: ${rssi}.`,
        );

        const p = peripherals.get(peripheral.id);
        if (p) {
          addOrUpdatePeripheral(peripheral.id, { ...peripheral, rssi });
        }

        const bleThing = createBleThing(
          peripheral.id,
          props.route.params.td,
          peripheralData.characteristics,
        );
        thingsStore.addThing(props.route.params.name, bleThing);
        console.log(bleThing);
        console.log(thingsStore.things);
        navigation.navigate("Overview", { screen: "Overview" });
      }
    };

    function sleep(ms: number) {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }

    useEffect(() => {
      try {
        BleManager.start({ showAlert: false })
          .then(() => console.debug("BleManager started."))
          .catch((error) =>
            console.error("BeManager could not be started.", error),
          );
      } catch (error) {
        console.error("unexpected error starting BleManager.", error);
        return;
      }

      const listeners = [
        bleManagerEmitter.addListener(
          "BleManagerDiscoverPeripheral",
          handleDiscoverPeripheral,
        ),
        bleManagerEmitter.addListener("BleManagerStopScan", handleStopScan),
        bleManagerEmitter.addListener(
          "BleManagerDisconnectPeripheral",
          handleDisconnectedPeripheral,
        ),
        bleManagerEmitter.addListener(
          "BleManagerDidUpdateValueForCharacteristic",
          handleUpdateValueForCharacteristic,
        ),
      ];

      handleAndroidPermissions();

      return () => {
        console.debug("[app] main component unmounting. Removing listeners...");
        for (const listener of listeners) {
          listener.remove();
        }
      };
    }, []);

    const handleAndroidPermissions = () => {
      if (Platform.OS === "android" && Platform.Version >= 31) {
        PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]).then((result) => {
          if (result) {
            console.debug(
              "[handleAndroidPermissions] User accepts runtime permissions android 12+",
            );
          } else {
            console.error(
              "[handleAndroidPermissions] User refuses runtime permissions android 12+",
            );
          }
        });
      } else if (Platform.OS === "android" && Platform.Version >= 23) {
        PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ).then((checkResult) => {
          if (checkResult) {
            console.debug(
              "[handleAndroidPermissions] runtime permission Android <12 already OK",
            );
          } else {
            PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ).then((requestResult) => {
              if (requestResult) {
                console.debug(
                  "[handleAndroidPermissions] User accepts runtime permission android <12",
                );
              } else {
                console.error(
                  "[handleAndroidPermissions] User refuses runtime permission android <12",
                );
              }
            });
          }
        });
      }
    };

    return (
      <Screen
        contentContainerStyle={$flatListContentContainer}
        safeAreaEdges={["top"]}
      >
        <Header
          title={props.route.params.name}
          leftIcon="back"
          onLeftPress={() => navigation.goBack()}
        />
        <Text tx="bleSelector.tagLine" />
        <Button
          tx={isScanning ? "bleSelector.scanning" : "bleSelector.scan"}
          onPress={startScan}
        />
        <View style={[fill, $item]}>
          {Array.from(peripherals.values()).length > 0 ? (
            <FlatList
              style={$flatListStyle}
              data={Array.from(peripherals.values())}
              contentContainerStyle={{ rowGap: 12 }}
              keyExtractor={(item) => item.id}
              renderItem={({ item }: { item: Peripheral }) => {
                return (
                  <ListItem
                    onPress={() => togglePeripheralConnection(item)}
                    topSeparator
                    rightIcon={item.connected ? "check" : undefined}
                  >
                    <Text>
                      <Text preset="bold">{item.name + "\n"}</Text>
                      <Text>{item.id + " "}</Text>
                      <Text>
                        RSSI: {item.rssi ? `${item.rssi} dBm` : "N/A"}
                      </Text>
                    </Text>
                  </ListItem>
                );
              }}
            />
          ) : (
            <Text tx="bleSelector.noPeripherals" style={center} />
          )}
        </View>
      </Screen>
    );
  },
);

/**
 * Deconsructs form in object
 * @param {Form} form form to analyze
 * @returns {Object} Object containing all parameters
 */
const deconstructForm = function (form: Form) {
  const deconstructedForm: Record<string, string> = {};

  // If deviceID contains '/' it gets also split.
  // path string is checked it is a UUID; everything else is added together to deviceID
  const pathElements = form[0].href.split("/");

  if (pathElements.length !== 3) {
    const regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    let deviceId = pathElements[0];

    for (let i = 1; i < pathElements.length; i++) {
      if (regex.test(pathElements[i]) === false) {
        deviceId = deviceId + "/" + pathElements[i];
      } else {
        // second last element is service id
        if (i === pathElements.length - 2) {
          deconstructedForm.serviceId = pathElements[i];
        }
        // Last element is characteristic
        if (i === pathElements.length - 1) {
          deconstructedForm.characteristicId = pathElements[i];
        }
      }
    }
    // DeviceId
    deconstructedForm.deviceId = deviceId;
  } else {
    // DeviceId
    deconstructedForm.deviceId = pathElements[0];

    // Extract serviceId
    deconstructedForm.serviceId = pathElements[1];

    // Extract characteristicId
    deconstructedForm.characteristicId = pathElements[2];
  }

  // Extract operation -> e.g. readproperty; writeproperty
  deconstructedForm.operation = form.op?.toString() ?? "";

  // Get BLE operation type
  deconstructedForm.bleOperation = form["sbo:methodName"];

  return deconstructedForm;
};
