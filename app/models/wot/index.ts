import * as WoT from "wot-typescript-definitions";
import { Servient } from "@node-wot/browser-bundle";
import { BluetoothClientFactory } from "./bindings/binding-bluetooth/Bluetooth";

let servient: Servient;
let wot: typeof WoT;

export const getServient = function (): Servient {
  if (!servient) {
    servient = new Servient();
    servient.addClientFactory(new BluetoothClientFactory());
  }
  return servient;
};

const getWot = async function (): Promise<typeof WoT> {
  if (!wot) {
    wot = await getServient().start();
  }
  return wot;
};

export const resetServient = async function (): Promise<void> {
  if (servient) {
    // destroy exposed things
    const things = servient.getThings();
    Object.entries(things).forEach(async ([id]) => {
      const thing = servient.getThing(id);
      if (thing) {
        await thing.destroy();
      }
    });
    await servient.shutdown();
  }
};

export const createThing = async function (
  td: WoT.ThingDescription,
  id: string | undefined,
): Promise<WoT.ConsumedThing> {
  if (id) {
    let tdStr = JSON.stringify(td);
    tdStr = tdStr.replace(/{{MacOrWebBluetoothId}}/g, id);
    td = JSON.parse(tdStr);
  }
  const wotServient = await getWot();
  const exposedThing = await wotServient.produce(td);
  const consumedThing = await wotServient.consume(
    exposedThing.getThingDescription(),
  );
  return consumedThing;
};
