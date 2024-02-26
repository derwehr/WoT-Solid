# Taking Care of Your Data: A SoLiD-based Mobile App for Wearable Data Collection and Visualization

## Showcase
Below are some screenshots and videos showcasing the app's features.
### SoLiD Authentication

<img align="right" width="300" src="images/SolidAuthentication.png">

In order to use the app, the user needs to authenticate with a SoLiD Pod. The app uses the **SoLiD OIDC authentication** flow to authenticate the user.

The user is redirected to the SoLiD Pod's authentication page, where the user can log in and grant the app access to the Pod.

After the user has authenticated, the app receives an access token, which is used to access the user's data on the Pod.

see the files [AuthenticationStore.ts](app/models/AuthenticationStore.ts) and [LoginScreen.tsx](app/screens/LoginScreen.tsx) for implementation details.

<br clear="right"/>

### Connecting Wearables
<table class="images" width="100%" style="border:0px solid white; width:100%;">
    <tr style="border: 0px">
        <td width="66%" style="border:0px; width: 66.66%">
            The Application connects to BLE wearable devices described with <a href="https://www.w3.org/TR/wot-thing-description11/">W3C WoT Thing Descriptions</a>. See the [tds](tds) folder for examples of Thing Descriptions for different wearables.
        </td>
        <td width="33%" style="border:0px; width: 33.33%">
            <video src="https://github.com/derwehr/WearableSolid/assets/7078901/6b3a02ac-d977-49f4-8393-34b256ddcd28"></video>
        </td>
    </tr>
</table>
<table>
    <tr style="border: 0px">
        <td width="66%" style="border:0px; width: 66.66%">
            After connecting to a wearable, users can browse the Thing's available <a href="https://www.w3.org/TR/wot-thing-description11/#interaction-affordances">Interaction Affordaces</a>, subscribe to Events Affordances and read Property Affordances.
        </td>
        <td width="33%" style="border:0px; width: 33.33%">
            <video src="https://github.com/derwehr/WearableSolid/assets/7078901/3cdc5a95-3fda-415f-9b4d-2e6abf4f76b4"></video>
        </td>
    </tr>
</table>

### Live Data Visualization

<table>
    <tr style="border: 0px">
        <td width="66%" style="border:0px; width: 66.66%">
            Subscribed Events are visualized in real-time using the <a href="https://formidable.com/open-source/victory/docs/native/">Victory Native</a> library.
        </td>
        <td width="33%" style="border:0px; width: 33.33%">
            <video src="https://github.com/derwehr/WearableSolid/assets/7078901/f9a2d0bb-1ca9-449b-8fa4-a6500d1c3acd"></video>
        </td>
    </tr>
</table>

### SoLiD Data Storage

<table>
    <tr style="border: 0px">
        <td width="66%" style="border:0px; width: 66.66%">
            The User may store the collected data in <a href="https://solidproject.org/">SoLiD PODs</a>. The data is stored in <a href="https://www.w3.org/TR/turtle/">Turtle</a>.
Stored data is also visualized to allow analyzing historical data comprehensively. 
        </td>
        <td width="33%" style="border:0px; width: 33.33%">
            <video src="https://github.com/derwehr/WearableSolid/assets/7078901/4b8a55ef-b641-49b7-a69c-1109ad27e9a7"></video>
        </td>
    </tr>
</table>

### Annotated Data
Below is an example of a Turtle file with annotated data. The collected measurements are stored as SOSA/SSN observations, annotated with the measurement's unit and datatype parsed from the TD, time and the location of the measurement gathered by the Android device, plus the authenticated user as the SOSA `featureOfInterest`.
```turtle
@prefix qudt: <http://qudt.org/1.1/schema/qudt#>.
@prefix geo: <http://www.w3.org/2003/01/geo/wgs84_pos#>.
@prefix sosa: <http://www.w3.org/ns/sosa/>.
@prefix xsd: <http://www.w3.org/2001/XMLSchema#>.

_:temperatureEventObservation1699558311647 a sosa:Observation;
    geo:lat 49.5946528;
    geo:long 11.0034048;
    sosa:hasFeatureOfInterest <https://derwehr.solidcommunity.net/profile/card#me>;
    sosa:hasResult _:temperatureEventResult1699558311647;
    sosa:observedProperty <https://w3id.org/seas/TemperatureProperty>;
    sosa:resultTime "2023-11-09T19:31:51.647000+00:00"^^xsd:dateTime.

_:temperatureEventResult1699558311647 a sosa:Result;
    qudt:numericValue 23.407204199294842;
    qudt:unit "http://qudt.org/1.1/vocab/unit#DEG_C";
    sosa:isResultOf _:temperatureEventObservation1699558311647.
```

## Installation
The app is built using [React Native](https://reactnative.dev/) and [Expo](https://expo.io/). To run the app, you need to have Node.js and npm installed.

1. Clone the repository
2. Install the dependencies
    ```bash
    npm install
    ```
3. Start the app
    ```bash
    npm start
    ```
    This will start the Expo development server and open the Expo DevTools in your browser. You can then run the app on an emulator or on your phone using the Expo Go app.
