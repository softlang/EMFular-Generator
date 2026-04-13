import {EClass, EEnum, EDataType} from './classifier';

interface Package {
  name: string;        // clean TS name
  path: string[];      // clean folder path segments
  subpackages: Package[];
  classes: EClass[];
  enums: EEnum[];
  datatypes: EDataType[];
}




