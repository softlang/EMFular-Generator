import {EClass, EEnum, EDataType} from './classifier';

export interface Package {
  name: string;        // clean TS name
  path: string[];      // clean folder path segments
  subpackages: Package[]; //better get rid of them, just use paths
  classes: EClass[];
  enums: EEnum[];
  datatypes: EDataType[];
}




