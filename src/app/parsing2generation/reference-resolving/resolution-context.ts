import { EPackageJson } from '../../parsing-model/package';
import {EClassifierJson, EClassJson, EDataTypeJson, EEnumJson} from '../../parsing-model/classifier';

export class ResolutionContext {
  // ID-based lookup
  classById: Map<string, EClassJson>;
  typeById: Map<string, EDataTypeJson | EEnumJson>;

  // Name-based lookup (per package)
  packageIndex: Map<EPackageJson, PackageIndex>;

  constructor(pkgs: EPackageJson[]) {
    this.classById = new Map<string, EClassJson>();
    this.typeById = new Map<string, (EDataTypeJson|EEnumJson)>();
    this.packageIndex = new Map<EPackageJson, PackageIndex>();
    //todo use pkgs to fill the maps
  }

  resolveCls(clsRef: string): EClassJson|undefined {
    return undefined
  }

  //todo add basic types here?
  resolveType(typeRef: string): (EEnumJson|EDataTypeJson)|undefined {
    return undefined
  }
}

export interface PackageIndex {
  pkg: EPackageJson;

  // Positional lookup list
  positionalClassifiers: EClassifierJson[];

  // Name-based lookup
  clasesByName: Map<string, EClassJson>;
  typesByName: Map<string, EDataTypeJson|EEnumJson>;
  subpackagesByName: Map<string, EPackageJson>;
}
