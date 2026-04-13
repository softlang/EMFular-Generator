import {ClassifierReference, TypeReference} from './cross-references';
import {Attribute, Reference} from './structural-feature';

export interface Classifier {
  name: string;
  path: string[];
}

export interface EEnum extends Classifier {
  name: string;
  path: string[];

  literals: string[];
}

export interface EDataType extends Classifier {
  name: string;
  path: string[];

  aliasedType: TypeReference;
}

export interface EClass extends Classifier {
  name: string;
  path: string[];

  superTypes: ClassifierReference[];
  attributes: Attribute[];
  references: Reference[];

  abstract: boolean;
  interfaceLike?: boolean;
}
