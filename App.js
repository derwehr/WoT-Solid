// This is the entry point if you run `yarn expo:start`
// If you run `yarn ios` or `yarn android`, it'll use ./index.js instead.
import App from "./app/app.tsx";
import React from "react";
import { registerRootComponent } from "expo";
import { Platform } from "react-native";

function IgniteApp() {
  return <App />;
}

if (Platform.OS !== "web") {
  registerRootComponent(IgniteApp);
}

export default IgniteApp;
