import {EPackageJson} from '../ecore-pipeline/parsing-model/package';
import {EClassJson} from '../ecore-pipeline/parsing-model/classifier';

export class EClassManager {

  static createEClass(pkg: EPackageJson, cls: EClassJson): string {
    return pkg.nsURI+"#//"+cls.name
  }
}
