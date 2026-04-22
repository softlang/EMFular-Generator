import {Resolvable} from './resolvable';
import {EAttributeJson, EReferenceJson} from './structural-feature';

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
  superTypes: Resolvable[];
  attributes: EAttributeJson[];
  references: EReferenceJson[];
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
