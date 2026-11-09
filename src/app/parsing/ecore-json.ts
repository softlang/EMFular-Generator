import { ClassifierRef, FeatureRef, ParseWarning } from './symbol-table';

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

export interface EPackageRef {
  path: string[]
}

export interface EClassifierJson {
  name: string;
  pkgRef: EPackageRef
}

export interface EClassJson extends EClassifierJson {
  kind: 'EClass';
  name: string;

  abstract: boolean;
  interfaceLike?: boolean;
  superTypes: ClassifierRef[];
  attributes: EAttributeJson[];
  references: EReferenceJson[];
}

export interface EAttributeJson {
  kind: 'EAttribute';
  name: string;
  type: string;
  resolvedTypeRef?: ClassifierRef;
  lowerBound: number;
  upperBound: number;
  defaultValueLiteral?: string;
}

export interface EReferenceJson {
  kind: 'EReference';

  // identity
  name: string;
  type: string;
  resolvedType: string;
  resolvedTypeRef?: ClassifierRef;

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
  resolvedOppositeRef?: FeatureRef;
  isTreeParent?: boolean; //detects opposites of trees
}

export interface EEnumJson extends EClassifierJson {
  kind: 'EEnum';
  name: string;
  literals: string[];
}

export interface EDataTypeJson extends EClassifierJson {
  kind: 'EDataType';
  name: string;
  instanceTypeName: string;
}

export interface ParseResult {
  packages: EPackageJson[];
  warnings: ParseWarning[];
}
