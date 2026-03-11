export interface EPackageJson {
  name: string;
  nsURI: string;
  nsPrefix: string;
  eClasses: EClassJson[];
  eEnums: EEnumJson[];
  eDataTypes: EDataTypeJson[];
}

export interface EClassJson {
  kind: "EClass";
  name: string;
  abstract: boolean;
  superTypes: string[];
  attributes: EAttributeJson[];
  references: EReferenceJson[];
}

export interface EAttributeJson {
  kind: "EAttribute";
  name: string;
  type: string;
  lowerBound: number;
  upperBound: number;
}

export interface EReferenceJson {
  kind: "EReference";
  name: string;
  type: string;
  containment: boolean;
  lowerBound: number;
  upperBound: number;
}

export interface EEnumJson {
  kind: "EEnum";
  name: string;
  literals: string[];
}

export interface EDataTypeJson {
  kind: "EDataType";
  name: string;
  instanceTypeName: string;
}

