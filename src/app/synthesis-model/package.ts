import {EClass, EEnum, EDataType} from './classifier';

export interface Package {
  nsURI: string;
  nsPrefix: string;
  path: string[];      // clean folder path segments, at least own name
  classes: EClass[];
  enums: EEnum[];
  datatypes: EDataType[];
}




