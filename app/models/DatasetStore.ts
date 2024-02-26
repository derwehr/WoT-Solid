import { Instance, flow, types } from "mobx-state-tree";
import * as Location from "expo-location";
import {
  createSolidDataset,
  createThing,
  SolidDataset,
  setThing,
  Thing,
  buildThing,
  saveSolidDatasetAt,
  setUrl,
} from "@inrupt/solid-client";
import { fetch } from "solid-authn-react-native";
import { DataSchema, DataSchemaValue } from "wot-typescript-definitions";
import { id } from "./AuthenticationStore";

interface LogEntry {
  affordanceName: string;
  timestamp: Date;
  dataSchema: DataSchema;
  dataValue: DataSchemaValue;
}

export const DatasetStoreModel = types
  .model("DatasetStore")
  .props({
    dataset: types.frozen<SolidDataset>(createSolidDataset()),
    things: types.optional(types.map(types.frozen<Thing>()), {}),
  })
  .views((self) => ({
    getThing(name: string) {
      return self.things.get(name);
    },
    getThings() {
      return self.things;
    },
    getDataset() {
      return self.dataset;
    },
  }))
  .actions((self) => ({
    addLogEntry: flow(function* (log: LogEntry) {
      if (log.dataSchema.type === "array") {
        for (const [key, value] of (
          log.dataValue as DataSchemaValue[]
        ).entries()) {
          const schema = log.dataSchema["bdo:variables"];
          const varName = Object.keys(schema)[key];
          const [observation, result] = yield logEntryToSosa(
            varName,
            schema[varName],
            value,
            log.timestamp,
          );
          self.things.set(observation.url.split("/").slice(-1)[0], observation);
          self.things.set(result.url.split("/").slice(-1)[0], result);

          let dataset = self.getDataset();
          dataset = setThing(dataset, observation);
          dataset = setThing(dataset, result);

          self.dataset = dataset;
        }
      } else {
        const [observation, result] = yield logEntryToSosa(
          log.affordanceName,
          log.dataSchema,
          log.dataValue as number,
          log.timestamp,
        );
        self.things.set(observation.url.split("/").slice(-1)[0], observation);
        self.things.set(result.url.split("/").slice(-1)[0], result);

        let dataset = self.getDataset();
        dataset = setThing(dataset, observation);
        dataset = setThing(dataset, result);

        self.dataset = dataset;
      }
    }),
    clear() {
      self.things.clear();
      self.dataset = createSolidDataset();
    },
    saveDataset: flow(function* () {
      let url = new URL(id);
      url = new URL(
        url.origin +
          "/public/WearableWoT/Recording-" +
          ((new Date() as any) / 1000) * 1000,
      );
      try {
        yield saveSolidDatasetAt(url.href, self.dataset, { fetch });
      } catch (e) {
        console.log(e);
        return false;
      }
      return true;
    }),
  }));

// converts a LogEntry to sosa:Observation and sosa:Result
async function logEntryToSosa(name, schema, value, timestamp) {
  const location = await Location.getCurrentPositionAsync({});

  // observation
  let observation = buildThing(
    createThing({
      name: `${name}-observation-${((timestamp as any) / 1000) * 1000}`,
    }),
  )
    .addUrl(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      "http://www.w3.org/ns/sosa/Observation",
    )
    .addUrl(
      "http://www.w3.org/ns/sosa/observedProperty",
      schema["ssn:forProperty"],
    )
    .addUrl("http://www.w3.org/ns/sosa/hasFeatureOfInterest", id)
    .addDatetime("http://www.w3.org/ns/sosa/resultTime", timestamp)
    .addDecimal(
      "http://www.w3.org/2003/01/geo/wgs84_pos#lat",
      location.coords.latitude,
    )
    .addDecimal(
      "http://www.w3.org/2003/01/geo/wgs84_pos#long",
      location.coords.longitude,
    )
    .build();

  // result
  const result = buildThing(
    createThing({
      name: `${name}-result-${((timestamp as any) / 1000) * 1000}`,
    }),
  )
    .addUrl(
      "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
      "http://www.w3.org/ns/sosa/Result",
    )
    .addDecimal("http://qudt.org/1.1/schema/qudt#numericValue", value)
    .addStringNoLocale(
      "http://qudt.org/1.1/schema/qudt#unit",
      schema.unit ?? "",
    )
    .addUrl("http://www.w3.org/ns/sosa/isResultOf", observation)
    .build();

  observation = setUrl(
    observation,
    "http://www.w3.org/ns/sosa/hasResult",
    result,
  );

  return [observation, result];
}

export type DatasetStore = Instance<typeof DatasetStoreModel>;
export type DatasetStoreSnapshot = Instance<typeof DatasetStoreModel>;
