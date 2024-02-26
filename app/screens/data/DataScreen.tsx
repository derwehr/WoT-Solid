import React, { FC, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { FlatList, ScrollView, ViewStyle } from "react-native";
import { AppStackScreenProps } from "app/navigators";
import { Header, ListItem, Screen, Text } from "app/components";
import { logout } from "solid-authn-react-native";
import { colors, spacing } from "../../theme";
import {
  SolidDataset,
  Thing,
  getSolidDataset,
  getThing,
  getThingAll,
} from "@inrupt/solid-client";
import { useStores } from "app/models";
import {
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryTooltip,
  createContainer,
} from "victory-native";
import { getValueByType } from "../Log/helpers";
import { SolidTable } from "../Log/SolidTable";
import { Picker } from "@react-native-picker/picker";
import MapView, { Marker } from "react-native-maps";

type DataScreenProps = AppStackScreenProps<"Data">;

const $flatListContentContainer: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.lg,
};

const $flatListStyle: ViewStyle = {
  paddingHorizontal: spacing.xs,
  backgroundColor: colors.palette.neutral200,
  flex: 1,
};

export const DataScreen: FC<DataScreenProps> = observer(function DataScreen() {
  const { authenticationStore } = useStores();
  const id = new URL(authenticationStore.id);
  const baseUrl = id.origin + "/public/WearableWoT/";
  const [data, setData] = React.useState<any[]>();
  const [selectedRecording, setSelectedRecording] = React.useState(null);
  const [selectedProperty, setSelectedProperty] = React.useState(null);
  const [dataset, setDataset] = React.useState<SolidDataset>(null);
  const [chartData, setChartData] = React.useState([]);
  const [locations, setLocations] = React.useState([]);
  const [properties, setProperties] = React.useState<Map<string, string>>(null);
  const [selectedObservation, setSelectedObservation] =
    React.useState<Thing>(null);
  const [selectedObservationName, setSelecetedObservationName] =
    React.useState<string>(null);
  const [selectedVis, setSelectedVis] = React.useState<string>("line");

  useEffect(() => {
    const fetchRecordings = async () => {
      const newDataset = await getSolidDataset(baseUrl);
      setDataset(newDataset);
      const things = getThingAll(newDataset);
      let recordings = [];
      for (const thing of things) {
        const name = thing.url.split("/").pop();
        if (name.startsWith("Recording-")) {
          recordings.push({ name: name, url: thing.url });
        }
      }
      setData(recordings);
    };

    fetchRecordings();
  }, [baseUrl]);

  useEffect(() => {
    async function getProperties(recording) {
      const newDataset = await getSolidDataset(recording);
      setDataset(newDataset);
      const things = getThingAll(newDataset);
      let properties = new Map();
      for (const thing of things) {
        // collect all http://www.w3.org/ns/sosa/observedProperty
        if (
          thing.predicates["http://www.w3.org/ns/sosa/observedProperty"] !==
          undefined
        ) {
          const p = thing.predicates[
            "http://www.w3.org/ns/sosa/observedProperty"
          ].namedNodes[0]
            .split("/")
            .pop();
          properties.set(
            p,
            thing.predicates["http://www.w3.org/ns/sosa/observedProperty"]
              .namedNodes[0],
          );
        }
      }
      return properties;
    }
    if (selectedRecording) {
      getProperties(selectedRecording.url).then((properties) => {
        setProperties(properties);
      });
    }
  }, [selectedRecording]);

  useEffect(() => {
    const fetchObservedProperties = async () => {
      const newDataset = await getSolidDataset(selectedRecording.url);
      setDataset(newDataset);
      const things = getThingAll(newDataset);

      console.debug(things);

      let chartData = [];
      let locations = [];
      // get all observations
      let observations = things.filter((thing) =>
        thing.url.includes("observation"),
      );
      // filter to only get observations that observe the selected property
      observations = observations.filter((obs) => {
        const observedProperty =
          obs.predicates["http://www.w3.org/ns/sosa/observedProperty"]
            .namedNodes[0];
        return observedProperty === properties.get(selectedProperty);
      });

      console.debug(observations);

      // push their result values and timestamps to chartData
      for (const observation of observations) {
        const resultTime = getValueByType(
          "datetime",
          observation,
          "http://www.w3.org/ns/sosa/resultTime",
        );
        const result = getThing(
          dataset,
          observation.predicates["http://www.w3.org/ns/sosa/hasResult"]
            .namedNodes[0],
        );

        let resultValue = getValueByType(
          "decimal",
          result,
          "http://qudt.org/1.1/schema/qudt#numericValue",
        );

        const lat = getValueByType(
          "decimal",
          observation,
          "http://www.w3.org/2003/01/geo/wgs84_pos#lat",
        );

        const long = getValueByType(
          "decimal",
          observation,
          "http://www.w3.org/2003/01/geo/wgs84_pos#long",
        );

        chartData.push({
          x: resultTime,
          y: resultValue,
          observation: observation,
        });

        locations.push({
          lat: lat,
          long: long,
          observation: observation,
        });
      }
      setChartData(chartData);
      setLocations(locations);
    };
    if (selectedProperty) {
      fetchObservedProperties();
    }
  }, [selectedProperty]);

  const getLabel = (datum) => {
    const observation = datum.observation;
    const result = getThing(
      dataset,
      observation.predicates["http://www.w3.org/ns/sosa/hasResult"]
        .namedNodes[0],
    );
    const resultValue = getValueByType(
      "decimal",
      result,
      "http://qudt.org/1.1/schema/qudt#numericValue",
    );
    return resultValue;
  };

  const VictoryZoomVoronoiContainer = createContainer("zoom", "voronoi") as any;

  return (
    <Screen
      contentContainerStyle={$flatListContentContainer}
      safeAreaEdges={["top"]}
    >
      <Header
        title="Data"
        rightTx="common.logOut"
        onRightPress={logout}
        leftIcon={
          selectedObservation !== null ||
          selectedProperty !== null ||
          selectedRecording !== null
            ? "back"
            : undefined
        }
        onLeftPress={() => {
          if (selectedObservation !== null) {
            setSelectedObservation(null);
          } else if (selectedProperty !== null) {
            setSelectedProperty(null);
          } else if (selectedRecording !== null) {
            setSelectedRecording(null);
          }
        }}
      />
      {selectedRecording ? (
        selectedProperty ? (
          <>
            <Picker
              selectedValue={selectedVis}
              onValueChange={(itemValue, itemIndex) =>
                setSelectedVis(itemValue)
              }
            >
              <Picker.Item label="Line" value="line" />
              <Picker.Item label="Map" value="map" />
            </Picker>
            {selectedVis === "line" && (
              <VictoryChart
                padding={{ top: 10, bottom: 10, left: 26, right: 50 }}
                theme={VictoryTheme.material}
                containerComponent={
                  <VictoryZoomVoronoiContainer
                    allowZoom={true}
                    allowPan={true}
                    onActivated={(points) => {
                      setSelectedObservation(points[0].observation);
                    }}
                    labelComponent={<VictoryTooltip />}
                    labels={({ datum }) => getLabel(datum)}
                  />
                }
              >
                <VictoryLine
                  style={{
                    data: { stroke: colors.palette.secondary500 },
                    parent: { border: "1px solid #ccc" },
                  }}
                  data={chartData}
                  scale={{ x: "time", y: "linear" }}
                  interpolation={"cardinal"}
                  x="x"
                  y="y"
                />
              </VictoryChart>
            )}
            {selectedVis === "map" && (
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: locations[0].lat,
                  longitude: locations[0].long,
                  latitudeDelta: 0.0032,
                  longitudeDelta: 0.0031,
                }}
              >
                {locations.map((location, index) => (
                  <Marker
                    key={index}
                    coordinate={{
                      latitude: location.lat,
                      longitude: location.long,
                    }}
                    title={"observation"}
                    description={location.observation.url}
                    onPress={() => {
                      setSelectedObservation(location.observation);
                    }}
                  />
                ))}
              </MapView>
            )}
            {(selectedVis === "line" || selectedVis === "map") &&
              selectedObservation !== null && (
                <ScrollView style={{ flex: 1 }}>
                  <Text preset="bold">{selectedObservationName}</Text>
                  <SolidTable
                    dataset={dataset}
                    thing={selectedObservation}
                    setThing={setSelectedObservation}
                    setTitle={setSelecetedObservationName}
                  />
                </ScrollView>
              )}
          </>
        ) : (
          properties !== null && (
            <FlatList
              data={Array.from(properties.keys())}
              style={$flatListStyle}
              renderItem={({ item, index }) => (
                <ListItem
                  text={item}
                  topSeparator={index === 0}
                  bottomSeparator
                  onPress={() => {
                    setSelectedProperty(item);
                  }}
                />
              )}
            />
          )
        )
      ) : (
        <FlatList
          data={data}
          style={$flatListStyle}
          renderItem={({ item, index }) => (
            <ListItem
              text={item.name}
              onPress={() => {
                setSelectedRecording(item);
              }}
              topSeparator={index === 0}
              bottomSeparator
              rightIcon="caretRight"
            />
          )}
        />
      )}
    </Screen>
  );
});
