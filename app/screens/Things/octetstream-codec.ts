import { DataSchema } from "wot-typescript-definitions";
import { Buffer } from "@craftzdog/react-native-buffer";
import { getFloat16 } from "@petamoriken/float16";

export function bytesToValue(
  bytes: Buffer,
  schema?: DataSchema,
  parameters: { [key: string]: string | undefined } = {},
): unknown {
  const bigEndian = !(parameters.byteSeq?.includes("little") === true); // default to big endian
  let signed = parameters.signed !== "false"; // default to signed
  const offset =
    schema?.["bdo:bitOffset"] !== undefined
      ? parseInt(schema["bdo:bitOffset"])
      : 0;
  let dataLength: number =
    schema?.["bdo:bitLength"] !== undefined
      ? parseInt(schema["bdo:bitLength"])
      : bytes.length * 8;
  let dataType: string = schema?.type;

  if (!dataType) {
    throw new Error("Missing 'type' property in schema");
  }

  // Check type specification
  // according paragraph 3.3.3 of https://datatracker.ietf.org/doc/rfc8927/
  // Parse type property only if this test passes
  if (
    /(short|(u)?int(8|16|32)?$|float(16|32|64)?|byte)/.test(
      dataType.toLowerCase(),
    )
  ) {
    const typeSem = /(u)?(short|int|float|byte)(8|16|32|64)?/.exec(
      dataType.toLowerCase(),
    );
    if (typeSem) {
      if (typeSem[1] === "u") {
        // compare with schema information
        if (parameters?.signed === "true") {
          throw new Error("Type is unsigned but 'signed' is true");
        }
        // no schema, but type is unsigned
        signed = false;
      }
      dataType = typeSem[2];
      if (parseInt(typeSem[3]) !== dataLength) {
        throw new Error(
          `Type is '${
            (typeSem[1] ?? "") + typeSem[2] + typeSem[3]
          }' but 'ex:bitLength' is ` + dataLength,
        );
      }
    }
  }

  if (dataLength > bytes.length * 8 - offset) {
    throw new Error(
      `'ex:bitLength' is ${dataLength}, but buffer length at offset ${offset} is ${
        bytes.length * 8 - offset
      }`,
    );
  }

  // Handle byte swapping
  if (parameters?.byteSeq?.includes("BYTE_SWAP") === true && bytes.length > 1) {
    bytes.swap16();
  }

  if (offset !== undefined && dataLength < bytes.length * 8) {
    bytes = readBits(bytes, offset, dataLength);
    dataLength = bytes.length * 8;
  }

  console.log("bytesToValue", {
    bytes,
    schema,
    parameters,
    bigEndian,
    signed,
    offset,
    dataLength,
    dataType,
  });

  // determine return type
  switch (dataType) {
    case "boolean":
      // true if any byte is non-zero
      return !bytes.every((val) => val === 0);
    case "byte":
    case "short":
    case "int":
    case "integer":
      return integerToValue(bytes, { dataLength, bigEndian, signed });
    case "float":
    case "double":
    case "number":
      return numberToValue(bytes, { dataLength, bigEndian });
    case "string":
      return bytes.toString(parameters.charset as BufferEncoding);
    case "object":
      if (schema === undefined || schema.properties === undefined) {
        throw new Error("Missing schema for object");
      }
      return objectToValue(bytes, schema, parameters);
    case "null":
      return null;
    case "array":
    default:
      throw new Error("Unable to handle dataType " + dataType);
  }
}

function integerToValue(
  bytes: Buffer,
  options: { dataLength: number; bigEndian: boolean; signed: boolean },
): number {
  const { dataLength, bigEndian, signed } = options;

  switch (dataLength) {
    case 8:
      return signed ? bytes.readInt8(0) : bytes.readUInt8(0);
    case 16:
      return bigEndian
        ? signed
          ? bytes.readInt16BE(0)
          : bytes.readUInt16BE(0)
        : signed
        ? bytes.readInt16LE(0)
        : bytes.readUInt16LE(0);

    case 32:
      return bigEndian
        ? signed
          ? bytes.readInt32BE(0)
          : bytes.readUInt32BE(0)
        : signed
        ? bytes.readInt32LE(0)
        : bytes.readUInt32LE(0);

    default: {
      const result = bigEndian
        ? signed
          ? bytes.readIntBE(0, dataLength / 8)
          : bytes.readUIntBE(0, dataLength / 8)
        : signed
        ? bytes.readIntLE(0, dataLength / 8)
        : bytes.readUIntLE(0, dataLength / 8);
      return result;
    }
  }
}

function numberToValue(
  bytes: Buffer,
  options: { dataLength: number; bigEndian: boolean },
): number {
  const { dataLength, bigEndian } = options;
  switch (dataLength) {
    case 16:
      return getFloat16(
        new DataView(bytes.buffer),
        bytes.byteOffset,
        !bigEndian,
      );
    case 32:
      return bigEndian ? bytes.readFloatBE(0) : bytes.readFloatLE(0);

    case 64:
      return bigEndian ? bytes.readDoubleBE(0) : bytes.readDoubleLE(0);

    default:
      throw new Error(
        "Wrong buffer length for type 'number', must be 16, 32, or 64 is " +
          dataLength,
      );
  }
}

function objectToValue(
  bytes: Buffer,
  schema?: DataSchema,
  parameters: { [key: string]: string | undefined } = {},
): unknown {
  if (schema?.type !== "object") {
    throw new Error("Schema must be of type 'object'");
  }

  const result: { [key: string]: unknown } = {};
  const sortedProperties = Object.getOwnPropertyNames(schema.properties);
  for (const propertyName of sortedProperties) {
    const propertySchema = schema.properties[propertyName];
    result[propertyName] = bytesToValue(bytes, propertySchema, parameters);
  }
  return result;
}

function readBits(buffer: Buffer, bitOffset: number, bitLength: number) {
  if (bitOffset < 0) {
    throw new Error("bitOffset must be >= 0");
  }

  if (bitLength < 0) {
    throw new Error("bitLength must be >= 0");
  }

  if (bitOffset + bitLength > buffer.length * 8) {
    throw new Error("bitOffset + bitLength must be <= buffer.length * 8");
  }

  // Convert the result to a Buffer of the correct length.
  const resultBuffer = Buffer.alloc(Math.ceil(bitLength / 8));

  let byteOffset = Math.floor(bitOffset / 8);
  let bitOffsetInByte = bitOffset % 8;
  let targetByte = buffer[byteOffset];
  let result = 0;
  let resultOffset = 0;

  for (let i = 0; i < bitLength; i++) {
    const bit = (targetByte >> (7 - bitOffsetInByte)) & 0x01;
    result = (result << 1) | bit;
    bitOffsetInByte++;

    if (bitOffsetInByte > 7) {
      byteOffset++;
      bitOffsetInByte = 0;
      targetByte = buffer[byteOffset];
    }

    // Write full bytes.
    if (
      i + 1 === bitLength % 8 ||
      (i + 1) % 8 === bitLength % 8 ||
      i === bitLength - 1
    ) {
      resultBuffer[resultOffset] = result;
      result = 0;
      resultOffset++;
    }
  }

  return resultBuffer;
}
