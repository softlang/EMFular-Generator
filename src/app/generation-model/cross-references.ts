export interface ClassifierReference {
  name: string;
  alias?: string; //only for avoiding duplicates
  path: string[]; //for importing, from pkg
  uri_prefix: string //for unique eClass assignment, from pkg
}

// for attributes: either EDataType, EEnum, or built in type
export interface TypeReference {
  target: AttributeTargetTypes;
  reference: ClassifierReference | BuiltInTypeReference
}

export interface BuiltInTypeReference {
  isBuiltIn: true;
  name: string;
}

// we do them by target type of type aliases and by real type of built ins as well as enum for EEnums
export enum AttributeTargetTypes {
  enum = 'enum',
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  date = 'date',
  any = 'any',
}


