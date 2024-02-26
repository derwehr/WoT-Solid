const en = {
  common: {
    ok: "OK!",
    cancel: "Cancel",
    back: "Back",
    logOut: "Log Out", // @demo remove-current-line
  },
  errorScreen: {
    title: "Something went wrong!",
    friendlySubtitle:
      "This is the screen that your users will see in production when an error is thrown. You'll want to customize this message (located in `app/i18n/en.ts`) and probably the layout as well (`app/screens/ErrorScreen`). If you want to remove this entirely, check `app/app.tsx` for the <ErrorBoundary> component.",
    reset: "RESET APP",
    traceTitle: "Error from %{name} stack", // @demo remove-current-line
  },
  emptyStateComponent: {
    generic: {
      heading: "So empty... so sad",
      content:
        "No data found yet. Try clicking the button to refresh or reload the app.",
      button: "Let's try this again",
    },
  },
  // @demo remove-block-start
  errors: {
    invalidEmail: "Invalid email address.",
  },
  loginScreen: {
    signIn: "Sign In",
    enterDetails: "Log in to your SoLiD Pod to get started.",
    emailFieldLabel: "Email",
    solidProvider: "Solid Provider",
    solidProviderPlaceholder: "Enter your solid pod provider here",
    passwordFieldLabel: "Password",
    emailFieldPlaceholder: "Enter your email address",
    passwordFieldPlaceholder: "Super secret password here",
    tapToSignIn: "Tap to sign in!",
    hint: "Hint: you can use any email address and your favorite password :)",
  },
  detailScreen: {
    clickToSubscribe: "Click on an interaction affordance to subscribe to it.",
    noProperties: "This Thing has no properties",
    noActions: "This Thing has no actions",
    noEvents: "This Thing has no events",
  },
  deleteThingDialog: {
    title: "Delete Thing",
  },
  log: {
    logTab: "Log",
    noThings: "No Thing's affordances have been subscribed to yet.",
  },
  thingsScreen: {
    addThing1: "1. Add a Thing Description",
    addThing2: "2. Name your Thing",
    addThing3: "3. Add your Thing",
    getFromUrl: "Get TD from URL",
    getFromFile: "Get TD from file",
    addThing: "Add new Thing",
    fileSystemInputLabel: "Select a file",
    title: "Things",
    tagLine: "Overview of added Thing Descriptions",
    noThings: "No Things added yet.",
    thingDescription: "Thing Description",
    thingId: "Thing ID",
    thingName: "Thing Name",
    thingType: "Thing Type",
    thingsTitle: "Things",
    thingsDescription: "Description",
    thingDescriptionPlaceholder: "Enter a Thing description",
    uriInputLabel: "Enter URI",
  },
  bleSelector: {
    title: "BLE devices",
    tagLine: "Select the corresponding BLE device below",
    scan: "Start scan",
    scanning: "Scanning...",
    noPeripherals: "No peripherals found, start scan to find some!",
  },
  dataScreen: {
    title: "Data",
  },
};

export default en;
export type Translations = typeof en;
