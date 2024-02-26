import { Instance, SnapshotOut, types } from "mobx-state-tree";

export let id = __DEV__
  ? "https://derwehr.solidcommunity.net/profile/card#me" // oidc does not work in dev mode, so we use a default webId, see https://github.com/o-development/solid-authn-react-native?tab=readme-ov-file#considerations-for-the-expo-go-app
  : undefined;
const setId = (value) => {
  id = value;
};

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    webId: types.maybe(types.string),
  })
  .views((store) => ({
    get isAuthenticated() {
      return !!store.webId;
    },
    get id() {
      return store.webId;
    },
  }))
  .actions((store) => ({
    setAuthToken(value?: string) {
      store.webId = value;
      setId(value);
    },
    logout() {
      store.webId = undefined;
    },
  }));

export type AuthenticationStore = Instance<typeof AuthenticationStoreModel>;
export type AuthenticationStoreSnapshot = SnapshotOut<
  typeof AuthenticationStoreModel
>;
