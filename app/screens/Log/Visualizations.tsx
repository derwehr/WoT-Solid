import React, { FC } from "react";
import { observer } from "mobx-react-lite";
import { ViewStyle } from "react-native";
import { AppStackScreenProps } from "app/navigators";
import { Header, Screen } from "app/components";
import { logout } from "solid-authn-react-native";
import { useStores } from "app/models";
import { colors, spacing } from "../../theme";
import { Thing } from "@inrupt/solid-client";
import {
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  VictoryTooltip,
  createContainer,
} from "victory-native";
import { Picker } from "@react-native-picker/picker";

type VisualizationsScreenProps = AppStackScreenProps<"Visualizations">;

export const VisualizationsScreen: FC<VisualizationsScreenProps> = observer(
  function VisualizationsScreen(props) {
    const { logStore } = useStores();
    const [selectedObservation, setSelectedObservation] =
      React.useState<Thing>(null);
    const [selectedObservationName, setSelecetedObservationName] =
      React.useState<string>(null);
    const [selectedVis, setSelectedVis] = React.useState<string>("line");
    const thingName = props.route.params.thingName;
    const affordanceName = props.route.params.affordanceName;

    // set initial values
    const buildData = function () {
      const observations = logStore.getEventObservations(
        thingName,
        affordanceName,
      );
      const data = observations.map((observation) => {
        return {
          y: observation.hasResult.value,
          x: observation.resultTime,
          observation: observation,
        };
      });
      return data;
    };

    const getLabel = (datum) => {
      return datum.y;
    };

    const VictoryZoomVoronoiContainer = createContainer(
      "zoom",
      "voronoi",
    ) as any;

    return (
      <Screen
        contentContainerStyle={$flatListContentContainer}
        safeAreaEdges={["top"]}
      >
        <Header
          title={affordanceName}
          leftIcon="back"
          onLeftPress={() => props.navigation.goBack()}
          rightTx="common.logOut"
          onRightPress={logout}
        />
        <Picker
          selectedValue={selectedVis}
          onValueChange={(itemValue, itemIndex) => setSelectedVis(itemValue)}
        >
          <Picker.Item label="Line" value="line" />
          <Picker.Item label="Map" value="map" />
        </Picker>
        {selectedVis === "line" && (
          <VictoryChart
            theme={VictoryTheme.material}
            padding={{ top: 10, bottom: 10, left: 50, right: 50 }}
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
              data={buildData()}
              scale={{ x: "time", y: "linear" }}
              interpolation={"cardinal"}
              x="x"
              y="y"
            />
          </VictoryChart>
        )}
      </Screen>
    );
  },
);

const $flatListContentContainer: ViewStyle = {
  flex: 1,
  paddingHorizontal: spacing.lg,
};
