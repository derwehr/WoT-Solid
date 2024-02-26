import { Instance, flow, SnapshotOut, types } from "mobx-state-tree";
import { DataSchema, DataSchemaValue } from "wot-typescript-definitions";
import { Observation } from "./sosa";
import * as Location from "expo-location";
import { id } from "./AuthenticationStore";

interface LogEntry {
  timestamp: Date;
  dataSchema: DataSchema;
  dataValue: DataSchemaValue;
}

const ObservationModel = types.model("Observation", {
  id: types.identifier,
  hasResult: types.model({
    id: types.identifier,
    // value is an array of strings or numbers
    value: types.number,
    unit: types.string,
    isResultOf: types.string,
  }),
  observedProperty: types.model({
    id: types.string,
  }),
  hasFeatureOfInterest: types.model({
    id: types.string,
  }),
  resultTime: types.Date,
  "geo:lat": types.number,
  "geo:long": types.number,
});

const thingObservationsModel = types
  .model("ThingObservations", {
    properties: types.optional(types.map(types.array(ObservationModel)), {}),
    actions: types.optional(types.map(types.array(ObservationModel)), {}),
    events: types.optional(types.map(types.array(ObservationModel)), {}),
  })
  .views((self) => ({
    getPropertyObservations(name: string): Observation[] | undefined {
      return self.properties.get(name);
    },
    getActionObservations(name: string): Observation[] | undefined {
      return self.actions.get(name);
    },
    getEventObservations(name: string): Observation[] | undefined {
      return self.events.get(name);
    },
    getObservations(type: string, name: string): Observation[] | undefined {
      return self[type].get(name);
    },
  }))
  .actions((self) => ({
    addPropertyObservation(name: string, observation: Observation) {
      const obs = self.properties.get(name) ?? [];
      observation.hasFeatureOfInterest.id = id;
      obs.push(observation);
      self.properties.set(name, obs);
    },
    addActionObservation(name: string, observation: Observation) {
      const obs = self.actions.get(name) ?? [];
      observation.hasFeatureOfInterest.id = id;
      obs.push(observation);
      self.actions.set(name, obs);
    },
    addEventObservation(name: string, observation: Observation) {
      const obs = self.events.get(name) ?? [];
      observation.hasFeatureOfInterest.id = id;
      obs.push(observation);
      self.events.set(name, obs);
    },
    addObservation(name: string, type: string, observation: Observation) {
      const obs = self[type].get(name) ?? [];
      observation.hasFeatureOfInterest.id = id;
      obs.push(observation);
      self[type].set(name, obs);
    },
    clearPropertyObservations(id: string) {
      self.properties.set(id, []);
    },
    clearActionObservations(id: string) {
      self.actions.set(id, []);
    },
    clearEventObservations(id: string) {
      self.events.set(id, []);
    },
    clearObservations(type: string, name: string) {
      self[type].set(name, []);
    },
    clearAllObservations() {
      self.properties.clear();
      self.actions.clear();
      self.events.clear();
    },
  }));

export const LogStoreModel = types
  .model("LogStore")
  .props({
    logs: types.optional(types.map(thingObservationsModel), {}),
  })
  .views((self) => ({
    getLog(id: string) {
      return self.logs.get(id);
    },
    getPropertyNames(thing: string) {
      return Array.from(self.logs.get(thing)?.properties.keys());
    },
    getActionNames(thing: string) {
      return Array.from(self.logs.get(thing)?.actions.keys());
    },
    getEventNames(thing: string) {
      return Array.from(self.logs.get(thing)?.events.keys());
    },
    getPropertyObservations(thing: string, name: string) {
      return self.logs.get(thing)?.properties.get(name);
    },
    getActionObservations(thing: string, name: string) {
      return self.logs.get(thing)?.actions.get(name);
    },
    getEventObservations(thing: string, name: string) {
      return self.logs.get(thing)?.events.get(name);
    },
    things() {
      return Array.from(self.logs.keys());
    },
  }))
  .actions((self) => ({
    addLog: flow(function* (
      thing: string,
      log: LogEntry,
      affordance: "properties" | "actions" | "events",
      name: string,
    ) {
      const thingObs = self.logs.get(thing) ?? thingObservationsModel.create();

      if (log.dataSchema.type === "array") {
        for (const [key, value] of (
          log.dataValue as DataSchemaValue[]
        ).entries()) {
          const schema = log.dataSchema["bdo:variables"];
          const varName = Object.keys(schema)[key];
          const observation = yield createObservation(
            varName,
            schema[varName],
            value as number,
            log.timestamp,
          );
          thingObs.addObservation(varName, affordance, observation);
        }
      } else {
        const observation = yield createObservation(
          name,
          log.dataSchema,
          log.dataValue as number,
          log.timestamp,
        );
        thingObs.addObservation(name, affordance, observation);
      }
      self.logs.set(thing, thingObs);
    }),
    removeLog(id: string) {
      self.logs.delete(id);
    },
    clearAllLogs() {
      self.logs.forEach((log) => {
        log.clearAllObservations();
      });
    },
  }));

async function createObservation(
  name: string,
  schema: DataSchema,
  value: number,
  timestamp: Date,
): Promise<Observation> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Permission to access location was denied");
  }
  const location = await Location.getCurrentPositionAsync({});

  return {
    id: `${name}-observation-${((timestamp as any) / 1000) * 1000}`,
    hasResult: {
      id: `${name}-result-${((timestamp as any) / 1000) * 1000}`,
      value: value,
      unit: schema.unit ?? "",
      isResultOf: `${name}-observation-${((timestamp as any) / 1000) * 1000}`,
    },
    observedProperty: {
      id: schema["ssn:forProperty"] ?? "",
    },
    hasFeatureOfInterest: {
      id: schema.featureOfInterest ?? "",
    },
    resultTime: timestamp,
    "geo:lat": location.coords.latitude,
    "geo:long": location.coords.longitude,
  };
}

export type LogStore = Instance<typeof LogStoreModel>;
export type LogStoreSnapshot = SnapshotOut<typeof LogStoreModel>;
