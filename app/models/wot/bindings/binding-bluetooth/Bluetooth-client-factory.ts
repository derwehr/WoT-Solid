/**
 * WebBluetooth protocol binding
 */
import { Core } from "@node-wot/browser-bundle";
import type { ProtocolClient, ProtocolClientFactory } from "../../types.d.ts";
import { BluetoothClient } from "./Bluetooth";
import { BinaryDataStreamCodec } from "../../codecs/BinaryDataCodec";

const { createLoggers, ContentSerdes } = Core;
const { debug } = createLoggers(
  "binding-bluetooth",
  "bluetooth-client-factory",
);

export default class BluetoothClientFactory implements ProtocolClientFactory {
  public readonly scheme: string = "gatt";
  private readonly clients: Set<ProtocolClient> = new Set();
  public contentSerdes: typeof ContentSerdes = ContentSerdes.get();

  constructor() {
    this.contentSerdes.addCodec(new BinaryDataStreamCodec());
  }

  public getClient(): ProtocolClient {
    debug(`Creating client for ${this.scheme}`);
    const client = new BluetoothClient();
    this.clients.add(client);
    return client;
  }

  public destroy(): boolean {
    debug(`stopping all clients for '${this.scheme}'`);
    this.clients.forEach((client) => client.stop());
    return true;
  }

  public init = (): boolean => true;
}
