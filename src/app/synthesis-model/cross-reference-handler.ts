import {ClassifierReference} from './cross-references';

export class CrossReferenceHandler {

  static createPath(cRef: ClassifierReference): string {
    return cRef.path.join("/")
  }

  static createEClass(cRef: ClassifierReference): string {
    return cRef.uri_prefix+cRef.name
  }
}
