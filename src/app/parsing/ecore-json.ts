export interface CrossPackageRef {
  originalRef: string;
  resolvedRef?: ResolvedRef
}

export interface ResolvedRef {
  name: string;
  pkgUri?: string;
}

export interface EPackageJson {
  name: string;
  pascalizedName: string;
  nsURI: string;
  nsPrefix: string;
  eClasses: EClassJson[];
  eEnums: EEnumJson[];
  eDataTypes: EDataTypeJson[];
  subPackages?: EPackageJson[];
}

export interface EClassifierJson {
  name: string;
  _rawName: string;
  _index: number;
  _id?: string;
}

export interface EClassJson extends EClassifierJson {
  kind: "EClass";
  name: string;
  _rawName: string;
  _index: number;
  _id?: string;

  abstract: boolean;
  interfaceLike?: boolean;
  superTypes: string[];           //raw URIs
  resolvedSuperTypes: string[];  // clean class names
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
  resolvedOpposite?: string;
  isTreeParent?: boolean; //detects opposites of trees
}


export interface EEnumJson extends EClassifierJson {
  kind: "EEnum";
  name: string;
  _rawName: string;
  _index: number;
  _id?: string;

  literals: string[];
}

export interface EDataTypeJson extends EClassifierJson {
  kind: "EDataType";
  name: string;
  _rawName: string;
  _index: number;
  _id?: string;

  instanceTypeName: string;
}

