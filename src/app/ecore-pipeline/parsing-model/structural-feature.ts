import {Resolvable} from './resolvable';

export interface EStructuralFeature {
  name: string;
  type: Resolvable;
  // cardinality
  lowerBound: number;
  upperBound: number;
}

export interface EAttributeJson extends EStructuralFeature {
  kind: "EAttribute";
  name: string;

  type: Resolvable;

  lowerBound: number;
  upperBound: number;

  defaultValueLiteral?: string;
}

export interface EReferenceJson extends EStructuralFeature {
  kind: "EReference";

  name: string;
  type: Resolvable;
  // cardinality
  lowerBound: number;
  upperBound: number;

  // semantics
  containment?: boolean;
  derived?: boolean;
  transient?: boolean;
  volatile?: boolean;
  changeable?: boolean;
  opposite?: Resolvable; // name of opposite reference, if any
  isTreeParent?: boolean; //detects opposites of trees
}
