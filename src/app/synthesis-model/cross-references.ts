export interface ClassifierReference {
  name: string;
  path: string[];
  alias?: string; //only for avoiding duplicates
}

// for attributes: either EDataType, EEnum, or built in type
export interface TypeReference {}
