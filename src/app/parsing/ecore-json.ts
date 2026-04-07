export enum RefFragmentKind {
  NameBased,     // #//A/b or other.ecore#//A/b
  Positional,    // #//@eClassifiers.2/@eStructuralFeatures.1
  IdBased        // #_abc123
}

export interface CompleteRef {
  originalRef: string;
  resolvedRef?: ResolvedRef
}

export interface ResolvedRef {
  name: string;
  pkgUri?: string;
}

export interface Resolvable {
  raw: string;
  resolved?: string;
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

  _index: number;
  _id?: string;
  _rawName: string;
  name: string;

  abstract: boolean;
  interfaceLike?: boolean;
  superTypes2: CompleteRef[]; //both, raw plus resolved
  resolvedSuperTypes: string[];  // clean class names
  attributes: EAttributeJson[];
  references: EReferenceJson[];
}

export interface EStructuralFeature {
  name: string;
  type: string;
  resolvedType: string;
  // cardinality
  lowerBound: number;
  upperBound: number;
}

export interface EAttributeJson extends EStructuralFeature {
  kind: "EAttribute";
  name: string;

  type: string;
  resolvedType: string;

  lowerBound: number;
  upperBound: number;

  defaultValueLiteral?: string;
}

export interface EReferenceJson extends EStructuralFeature {
  kind: "EReference";

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

