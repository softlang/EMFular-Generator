import {EClassifierJson, EClassJson, EDataTypeJson, EEnumJson} from './classifier';

export interface EPackageJson {
  name: string;
  pascalizedName: string;
  nsURI: string;
  nsPrefix: string;
  eClassifiers: EClassifierJson[];
  eClasses: EClassJson[];
  eEnums: EEnumJson[];
  eDataTypes: EDataTypeJson[];
  subPackages?: EPackageJson[];
}


