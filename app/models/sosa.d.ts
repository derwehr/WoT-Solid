// The W3C SOSA SSN ontology mapped to TypeScript interfaces.
export interface Sensor {
  id: string;
  label?: string;
  description?: string;
  madeObservation?: Observation[];
}

export interface Observation {
  id: string;
  hasResult: Result;
  observedProperty: Property;
  hasFeatureOfInterest: FeatureOfInterest;
  resultTime: Date;
  "geo:lat"?: number;
  "geo:long"?: number;
  [key: string]: any;
}

export interface Result {
  id: string;
  value: number;
  unit: string;
  isResultOf: string;
}

export interface Property {
  id: string;
  label?: string;
  description?: string;
}

export interface FeatureOfInterest {
  id: string;
  label?: string;
  description?: string;
}
