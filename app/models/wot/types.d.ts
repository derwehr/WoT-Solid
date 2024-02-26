import { Tools as TD } from "@node-wot/browser-bundle";

export declare class Content {
  type: string;
  body: NodeJS.ReadableStream;
  constructor(type: string, body: NodeJS.ReadableStream);
  toBuffer(): Promise<Buffer>;
}

export interface ProtocolClient {
  readResource(form: TD.Form): Promise<Content>;
  writeResource(form: TD.Form, content: Content): Promise<void>;
  invokeResource(form: TD.Form, content?: Content): Promise<Content>;
  unlinkResource(form: TD.Form): Promise<void>;
  subscribeResource(
    form: TD.Form,
    next: (content: Content) => void,
    error?: (error: Error) => void,
    complete?: () => void,
  ): Promise<Subscription>;
  start(): Promise<void>;
  stop(): Promise<void>;
  setSecurity(
    metadata: Array<TD.SecurityScheme>,
    credentials?: unknown,
  ): boolean;
}

export interface ProtocolClientFactory {
  readonly scheme: string;
  getClient(): ProtocolClient;
  init(): boolean;
  destroy(): boolean;
}

export declare class ContentSerdes {
  private static instance;
  static readonly DEFAULT: string;
  static readonly TD: string;
  static readonly JSON_LD: string;
  private codecs;
  private offered;
  static get(): ContentSerdes;
  static getMediaType(contentType: string): string;
  static getMediaTypeParameters(contentType: string): {
    [key: string]: string | undefined;
  };

  addCodec(codec: ContentCodec, offered?: boolean): void;
  getSupportedMediaTypes(): Array<string>;
  getOfferedMediaTypes(): Array<string>;
  isSupported(contentType: string): boolean;
  contentToValue(
    content: ReadContent,
    schema: DataSchema,
  ): DataSchemaValue | undefined;
  valueToContent(
    value: DataSchemaValue | ReadableStream,
    schema: DataSchema | undefined,
    contentType?: string,
  ): Content;
}

export interface ContentCodec {
  getMediaType(): string;
  bytesToValue(
    bytes: Buffer,
    schema?: DataSchema,
    parameters?: {
      [key: string]: string | undefined;
    },
  ): DataSchemaValue;
  valueToBytes(
    value: unknown,
    schema?: DataSchema,
    parameters?: {
      [key: string]: string | undefined;
    },
  ): Buffer;
}
