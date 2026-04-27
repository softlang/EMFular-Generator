import {EPackageJson} from '../ecore-pipeline/parsing-model/package';
import {EClassJson} from '../ecore-pipeline/parsing-model/classifier';

export class EClassManager {

  static createEClass(pkg: EPackageJson, cls: EClassJson): string {
    return this.createEClassFromStr(pkg.nsURI,cls.name)
  }

  static createEClassFromPkgStr(pkg: string, cls: EClassJson) {
    return this.createEClassFromStr(pkg, cls.name)
  }

  static createEClassFromStr(pkg: string, cls: string): string {
    return pkg+"#//"+cls
  }
}
