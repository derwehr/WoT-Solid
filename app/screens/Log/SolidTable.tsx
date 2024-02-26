import React, { ReactElement, useMemo } from "react";
import { fetch } from "solid-authn-react-native";
import {
  SolidDataset,
  Thing,
  getSolidDataset,
  getThing,
} from "@inrupt/solid-client";
import { DataType, getValueByType } from "./helpers";
import { Cell, Table, TableWrapper } from "react-native-reanimated-table";
import { colors, layout } from "app/theme";
import { Text } from "app/components";

export interface TableProps {
  thing: Thing;
  dataset: SolidDataset;
  setThing: (thing: Thing) => void;
  setTitle: (title: string) => void;
}

const knownPrefixes = {
  "http://www.w3.org/1999/02/22-rdf-syntax-ns#": "rdf:",
  "http://www.w3.org/2000/01/rdf-schema#": "rdfs:",
  "http://www.w3.org/2001/XMLSchema#": "xsd:",
  "http://www.w3.org/2002/07/owl#": "owl:",
  "http://www.w3.org/2003/01/geo/wgs84_pos#": "geo:",
  "http://www.w3.org/2004/02/skos/core#": "skos:",
  "http://www.w3.org/2006/vcard/ns#": "vcard:",
  "http://www.w3.org/ns/pim/space#": "pim:",
  "http://www.w3.org/ns/solid/terms#": "solid:",
  "http://www.w3.org/ns/auth/acl#": "acl:",
  "http://www.w3.org/ns/ldp/": "ldp:",
  "http://xmlns.com/foaf/0.1/": "foaf:",
  "http://www.w3.org/ns/sosa/": "sosa:",
  "http://www.w3.org/ns/ssn/": "ssn:",
  "https://inrupt.com/.well-known/sdk-local-node/": "_:",
  "http://qudt.org/1.1/schema/qudt#": "qudt:",
  "http://qudt.org/1.1/vocab/unit#": "qudt-unit:",
  "http://schema.org/": "schema:",
};

/**
 * Displays values from an array of [Things].
 */
export function SolidTable(props: TableProps): ReactElement | null {
  const { dataMap } = useMemo(() => {
    const dataMap: Map<string, Array<unknown>> = new Map();
    // loop through the thing's predicates
    const thing = props.thing;
    Object.keys(thing.predicates).forEach((predicate) => {
      // get the value of the property
      let type = "string";
      if (thing.predicates[predicate].literals) {
        type = Object.keys(thing.predicates[predicate].literals)[0]
          .split("#")[1]
          .toLocaleLowerCase();
      }
      let value =
        getValueByType(type as DataType, thing, predicate) ??
        getValueByType(type as DataType, thing, predicate, "en");
      if (value === null) {
        if (thing.predicates[predicate].namedNodes?.length > 0) {
          value =
            (thing.predicates[predicate].namedNodes[0] as string) ??
            (thing.predicates[predicate].blankNodes[0] as string);
        } else if (thing.predicates[predicate].blankNodes?.length > 0) {
          value = thing.predicates[predicate].blankNodes[0] as string;
        } else {
          value = "";
        }
      }

      // add the property to the data array
      if (dataMap.get(predicate) === undefined) {
        dataMap.set(predicate, [predicate]);
      }

      // add the value to the data array
      dataMap.get(predicate).push(value);
    });

    return { dataMap };
  }, [props.thing]);

  // convert the data map to an array
  const data = Array.from(dataMap.values());

  const formatCell = function (cellData: any) {
    if (isValidUrl(cellData)) {
      const uri: string = cellData.toString();
      let prefix: string;
      let thing: string;
      if (uri.includes("#")) {
        const split = uri.split("#");
        prefix = split[0] + "#";
        thing = split[1];
      } else {
        prefix = cellData.toString().split("/").slice(0, -1).join("/") + "/";
        thing = cellData.toString().split("/").slice(-1)[0];
      }
      if (knownPrefixes[prefix] !== undefined) {
        cellData = knownPrefixes[prefix] + thing;
      }
      return (
        <Text
          style={{ color: colors.palette.primary600 }}
          onPress={async () => {
            let newDataSet;
            if (prefix === "https://inrupt.com/.well-known/sdk-local-node/") {
              newDataSet = props.dataset;
            } else {
              console.debug(uri);
              newDataSet = await getSolidDataset(uri, { fetch });
            }
            const newThing = getThing(newDataSet, uri);
            props.setThing(newThing);
            props.setTitle(thing);
          }}
        >
          {cellData}
        </Text>
      );
    } else {
      return cellData.toString();
    }
  };

  return (
    <Table>
      {data.map((rowData, index) => (
        <TableWrapper key={index} style={layout.row}>
          {rowData.map((cellData, cellIndex) => (
            <Cell key={cellIndex} data={formatCell(cellData)} />
          ))}
        </TableWrapper>
      ))}
    </Table>
  );
}

const isValidUrl = function (string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
};
