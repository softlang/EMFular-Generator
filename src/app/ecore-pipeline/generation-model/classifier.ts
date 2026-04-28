import {ClassifierReference, TypeReference} from './cross-references';
import {Attribute, Reference} from './structural-feature';

export interface Classifier {
  name: string;
}

export interface EEnum extends Classifier {
  name: string;
  literals: string[];
}

export interface EDataType extends Classifier {
  name: string;
  aliasedType: TypeReference;
}

export interface EClass extends Classifier {
  name: string;

  superTypes: SuperTypes;
  attributes: Attribute[];
  references: Reference[];

  abstract: boolean;
  interfaceLike?: boolean;
}

//distinguish interfaces and real classes on super:
export interface SuperTypes {
  realParent?: ClassifierReference;
  interfaces: ClassifierReference[];
}
