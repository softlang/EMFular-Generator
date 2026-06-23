import {ClassifierReference, TypeReference} from './cross-references';

export interface StructuralFeature {
  name: string;
  type: TypeReference|ClassifierReference
  lowerBound: number;
  upperBound: number;
}

export interface Attribute extends StructuralFeature{
  name: string;
  type: TypeReference;
  lowerBound: number;
  upperBound: number;

  defaultValueLiteral?: string;
}

export interface Reference extends StructuralFeature {
  name: string;
  type: ClassifierReference;
  lowerBound: number;
  upperBound: number;

  opposite?: string;
  isTreeParent?: boolean;
  containment?: boolean;
  derived?: boolean;
  transient?: boolean;
  volatile?: boolean;
  changeable?: boolean;
}
