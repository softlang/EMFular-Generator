import {ClassifierReference} from './cross-references';

export class CrossReferenceHandler {

  static createPath(cRef: ClassifierReference): string {
    return cRef.path.join("/")
  }

  static createEClass(cRef: ClassifierReference): string {
    return cRef.uri_prefix+cRef.name
  }

  /*
 private classFromReferences(packages: Package[], rootByUser: ClassifierReference): EClass {
   let paths = rootByUser.path
   let pkgs = packages
   let pkg: Package|undefined;
   while (paths.length > 0) {
     let nextSegment = paths.pop()
     pkg = pkgs.find(p => p.name === nextSegment)
     if(pkg == null) {
       throw new Error("path to root not resolvable")
     } else {
       pkgs = pkg.subpackages
     }
   }
   const res = pkg?.classes.find(c => c.name===rootByUser.name)
   if(!res) {
     throw new Error(`No class with the right name ${rootByUser.name} found on path ${rootByUser.path}`)
   } else {
     return res;
   }
 }*/

}
