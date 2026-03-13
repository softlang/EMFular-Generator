export interface EPackageJson {
  name: string;
  pascalizedName: string;
  nsURI: string;
  nsPrefix: string;
  root?: EClassJson,
  eClasses: EClassJson[];
  eEnums: EEnumJson[];
  eDataTypes: EDataTypeJson[];
}

export interface EClassJson {
  kind: "EClass";
  name: string;
  _index: number;
  abstract: boolean;
  superTypes: string[];           //raw URIs
  resolvedSuperTypes: string[];  // clean class names
  interfaceLike?: boolean;      //only set this when we can inspect all supertypess
  attributes: EAttributeJson[];
  references: EReferenceJson[];
}

export interface EAttributeJson {
  kind: "EAttribute";
  name: string;
  type: string;
  lowerBound: number;
  upperBound: number;
  defaultValueLiteral?: string;
}

export interface EReferenceJson {
  kind: "EReference";

  // identity
  name: string;
  type: string;
  resolvedType: string;

  // cardinality
  lowerBound: number;
  upperBound: number;

  // semantics
  containment?: boolean;
  derived?: boolean;
  transient?: boolean;
  volatile?: boolean;
  changeable?: boolean;
  opposite?: string; // name of opposite reference, if any
  isTreeParent?: boolean; //detects opposites of trees
}


export interface EEnumJson {
  kind: "EEnum";
  name: string;
  _index: number;
  literals: string[];
}

export interface EDataTypeJson {
  kind: "EDataType";
  name: string;
  _index: number;
  instanceTypeName: string;
}

