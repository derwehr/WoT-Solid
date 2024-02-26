/**
 * @fileoverview Bluetooth protocol binding for eclipse/thingweb.node-wot
 */

import { Core } from "@node-wot/browser-bundle";
import type { Content, ProtocolClient } from "../../types.d.ts";
import { Form } from "@node-wot/td-tools";
import { Subscription } from "rxjs";
import { Readable } from "stream";

const { ProtocolHelpers, createLoggers } = Core;

export class BluetoothForm extends Form {
  public "wbt:id"?: string;
  public "sbo:methodName": string;
}

const { debug } = createLoggers("binding-bluetooth", "bluetooth-client");

export default class BluetoothClient implements ProtocolClient {
  subscriptions: Map<string, Subscription>;

  constructor() {
    debug("created client");
    this.subscriptions = new Map();
  }

  public toString(): string {
    return "[BluetoothClient]";
  }

  public async readResource(form: BluetoothForm): Promise<Content> {
    const deconstructedForm = this.deconstructForm(form);

    const characteristic = await getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId,
    );

    debug(
      `invoking "readValue" on characteristic ${deconstructedForm.characteristicId}`,
    );

    const value = await characteristic.readValue();

    let buff;

    if (form["bdo:signed"]) {
      buff = new Int8Array(value.buffer);
    } else {
      buff = new Uint8Array(value.buffer);
    }
    // Convert to readable
    const body = Readable.from(buff);

    return {
      type: form.contentType ?? "application/x.binary-data-stream",
      body,
      toBuffer: () => {
        return ProtocolHelpers.readStreamFully(body);
      },
    };
  }

  public async writeResource(
    form: BluetoothForm,
    content: Content,
  ): Promise<void> {
    // Extract information out of form
    const deconstructedForm = this.deconstructForm(form);
    let arrBuffer;
    // Convert readableStreamToBuffer
    if (typeof content !== "undefined") {
      const buffer = await content.toBuffer();
      arrBuffer = buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
    } else {
      // If content not defined write buffer < 00 >
      arrBuffer = new ArrayBuffer(1);
    }

    const characteristic = await getCharacteristic(
      deconstructedForm.deviceId,
      deconstructedForm.serviceId,
      deconstructedForm.characteristicId,
    );

    // Select what operation should be executed
    switch (deconstructedForm.bleOperation) {
      case "sbo:write-without-response":
        debug(
          `invoking "writeValueWithoutResponse" on characteristic ${deconstructedForm.characteristicId}`,
        );
        await characteristic.writeValueWithoutResponse(arrBuffer);
        break;

      case "sbo:write":
        debug(
          `invoking "writeValueWithResponse" on characteristic ${deconstructedForm.characteristicId}`,
        );
        await characteristic.writeValueWithResponse(arrBuffer);
        break;

      default: {
        throw new Error(
          `unknown operation ${deconstructedForm["sbo:methodName"]}`,
        );
      }
    }
  }

  public invokeResource(
    form: BluetoothForm,
    content: Content,
  ): Promise<Content> {
    // TODO check if href is service/char/operation, then write,
    // might also be gatt://operation, i.e watchAdvertisements
    return this.writeResource(form, content).then(() => {
      return Promise.resolve({
        type: "application/json",
        body: new Readable(),
        toBuffer: async () => {
          /* istanbul ignore next */
          return Buffer.from([]);
        },
      });
    });
  }

  public unlinkResource(form: BluetoothForm): Promise<void> {
    const subscription = this.subscriptions.get(form.href);
    if (subscription) {
      subscription.unsubscribe();
    }
    return Promise.resolve();
  }

  public async subscribeResource(
    form: BluetoothForm,
    next: (content: Content) => void,
    _error?: (error: Error) => void,
  ): Promise<Subscription> {
    // Extract information out of form
    const { deviceId, serviceId, characteristicId, bleOperation } =
      this.deconstructForm(form);

    // if ble operation is not sbo:notify or subscribe, throw error
    if (bleOperation !== "sbo:notify" && bleOperation !== "sbo:subscribe") {
      throw new Error(`operation ${bleOperation} is not supported`);
    }

    debug(
      `subscribing to characteristic with serviceId ${serviceId} characteristicId ${characteristicId}`,
    );

    const handler = (event: Event) => {
      debug(`Received "characteristicvaluechanged" event: ${event}`);
      const value = (event.target as BluetoothRemoteGATTCharacteristic)
        .value as DataView;
      let buff;
      if (form["bdo:signed"]) {
        buff = new Int8Array(value.buffer);
      } else {
        buff = new Uint8Array(value.buffer);
      }
      // Convert to readable
      const body = Readable.from(buff);
      next({
        type: form.contentType ?? "application/x.binary-data-stream",
        body,
        toBuffer: () => {
          return ProtocolHelpers.readStreamFully(body);
        },
      });
    };

    const characteristic = await getCharacteristic(
      deviceId,
      serviceId,
      characteristicId,
    );

    characteristic.addEventListener("characteristicvaluechanged", handler);

    await characteristic.startNotifications();

    const subscription = new Subscription(() => {
      characteristic.stopNotifications();
      characteristic.removeEventListener("characteristicvaluechanged", handler);
    });
    this.subscriptions.set(form.href, subscription);
    return subscription;
  }

  public async start(): Promise<void> {
    // do nothing
  }

  public async stop(): Promise<void> {
    debug("Stopping client");
    for (const subscription of this.subscriptions.values()) {
      subscription.unsubscribe();
    }
    this.subscriptions.clear();
  }

  public setSecurity(): boolean {
    return false;
  }

  /**
   * Deconsructs form in object
   * @param {Form} form form to analyze
   * @returns {Object} Object containing all parameters
   */
  deconstructForm = function (form: BluetoothForm) {
    const deconstructedForm: Record<string, string> = {};

    // Remove gatt://
    deconstructedForm.path = form.href.split("//")[1];

    // If deviceID contains '/' it gets also split.
    // path string is checked it is a UUID; everything else is added together to deviceID
    const pathElements = deconstructedForm.path.split("/");

    if (pathElements.length !== 3) {
      const regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      let deviceId = pathElements[0];

      for (let i = 1; i < pathElements.length; i++) {
        if (regex.test(pathElements[i]) === false) {
          deviceId = deviceId + "/" + pathElements[i];
        } else {
          // second last element is service id
          if (i === pathElements.length - 2) {
            deconstructedForm.serviceId = pathElements[i];
          }
          // Last element is characteristic
          if (i === pathElements.length - 1) {
            deconstructedForm.characteristicId = pathElements[i];
          }
        }
      }
      // DeviceId
      deconstructedForm.deviceId = deviceId;
    } else {
      // DeviceId
      deconstructedForm.deviceId = pathElements[0];

      // Extract serviceId
      deconstructedForm.serviceId = pathElements[1];

      // Extract characteristicId
      deconstructedForm.characteristicId = pathElements[2];
    }

    // Extract operation -> e.g. readproperty; writeproperty
    deconstructedForm.operation = form.op?.toString() ?? "";

    // Get BLE operation type
    deconstructedForm.bleOperation = form["sbo:methodName"];

    return deconstructedForm;
  };
}

/**
 * Get characteristic
 * @param {string} deviceId device id
 * @param {string} serviceId service id
 * @param {string} characteristicId characteristic id
 * @returns {Promise<BluetoothRemoteGATTCharacteristic>} characteristic
 * @throws {Error} if characteristic not found
 */
async function getCharacteristic(
  deviceId: string,
  serviceId: string,
  characteristicId: string,
): Promise<BluetoothRemoteGATTCharacteristic> {
  const devices = await navigator.bluetooth.getDevices();
  const device = devices.find((device) => device.id === deviceId);
  if (!device) {
    throw new Error(`device with id ${deviceId} not found`);
  }

  debug(`connecting to device ${deviceId}`);
  const server = await device.gatt?.connect();
  if (!server) {
    throw new Error(`could not connect to device ${deviceId}`);
  }
  debug(`connected to device ${deviceId}`);

  debug(`getting service ${serviceId}`);
  const service = await server.getPrimaryService(serviceId);
  if (!service) {
    throw new Error(`service with id ${serviceId} not found`);
  }

  const characteristic = await service.getCharacteristic(characteristicId);
  if (!characteristic) {
    throw new Error(`characteristic with id ${characteristicId} not found`);
  }

  return characteristic;
}
