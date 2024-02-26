// This is the first file that ReactNative will run when it starts up.
// If you use Expo (`yarn expo:start`), the entry point is ./App.js instead.
// Both do essentially the same thing.

import "node-libs-react-native/globals";
import App from "./app/app.tsx";
import React from "react";
import { AppRegistry } from "react-native";

function IgniteApp() {
  return <App />;
}

AppRegistry.registerComponent("WearableWot", () => IgniteApp);
export default App;
