import {ClassifierRef, EClassifierJson} from '../../parsing/ecore-json';

export class ImportPathCreator {

  static cls2pkgRef(cls: EClassifierJson): ClassifierRef {
    return {
      ...cls.pkgRef,
      name: cls.name,
      origin: 'local'
    }
  }

  /**
   * produces imports like '{ ${targetRef.name} } from path/classname'
   * be careful: this only works for classes and interfaces that get own TS files but not for enums and type aliases that live in one own file
   * todo should we make the type explicit on such a ref?
   * the import or import type is left out to allow users to decide between these options
   * @param targetRef
   * @param ownPkgRef
   * @param onlyType whether import or import type should be created
   */
  static createImportBetweenClassifiers(
    targetRef: ClassifierRef,
    ownPkgRef: ClassifierRef,
    onlyType : boolean = false
  ): string|undefined {
    //avoid importing itself:
    if(ownPkgRef.name == targetRef.name
      && ownPkgRef.pkgPath == targetRef.pkgPath //todo is this really the identity?
    ){
      return undefined
    }
    let result: string = `import ${onlyType? "type ": ""} { ${targetRef.name} } from `;
    const relativePath = this.getRelativePath(ownPkgRef.pkgPath??[], targetRef.pkgPath??[])
    if(relativePath.length == 0){
      result += `'./${targetRef.name}';`
    } else {
      result += `'${relativePath.join("/")}/${targetRef.name}';`
    }
    return result;
  }

  private static getRelativePath(from: string[], to: string[]): string[] {
    const common = this.getCommonPrefixLength(from, to);
    return [
      ...Array(from.length - common).fill('..'),
      ...to.slice(common)
    ]
  }

  private static getCommonPrefixLength(a: string[], b: string[]): number {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) {
      i++;
    }
    return i;
  }

}
