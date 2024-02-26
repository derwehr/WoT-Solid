import { Instance, SnapshotOut, types } from "mobx-state-tree";
import { AuthenticationStoreModel } from "./AuthenticationStore";
import { DatasetStoreModel } from "./DatasetStore";
import { LogStoreModel } from "./LogStore";
import { ThingsStoreModel } from "./ThingsStore";

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model("RootStore").props({
  authenticationStore: types.optional(AuthenticationStoreModel, {}),
  thingsStore: types.optional(ThingsStoreModel, {}),
  logStore: types.optional(LogStoreModel, {}),
  datasetStore: types.optional(DatasetStoreModel, {}),
});

/**
 * The RootStore instance.
 */
export type RootStore = Instance<typeof RootStoreModel>;
/**
 * The data of a RootStore.
 */
export type RootStoreSnapshot = SnapshotOut<typeof RootStoreModel>;
