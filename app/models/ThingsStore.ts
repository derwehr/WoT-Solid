import { getRoot, Instance, SnapshotOut, types } from "mobx-state-tree";
import { BleThing } from "app/screens";
import { RootStore } from "./RootStore";

export const ThingsStoreModel = types
  .model("ThingsStore")
  .props({
    // things is a map of bleThing s
    things: types.optional(types.map(types.frozen<BleThing>()), {}),
  })
  .views((self) => ({
    thingIds() {
      return Array.from(self.things.keys());
    },
    getThing(id: string) {
      return self.things.get(id);
    },
  }))
  .actions((self) => ({
    addThing(id: string, thing: BleThing) {
      self.things.set(id, thing);
    },
    removeThing(id: string) {
      self.things.delete(id);
      const root = getRoot(self);
      (root as RootStore).logStore.removeLog(id);
    },
  }));

export type ThingsStore = Instance<typeof ThingsStoreModel>;
export type ThingsStoreSnapshot = SnapshotOut<typeof ThingsStoreModel>;
