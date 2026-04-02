import { Injectable } from '@angular/core';
import {
  EPackageJson,
  EReferenceJson,
} from './ecore-json';
import {Classifier2JsonService} from './classifier2json.service';

@Injectable({
  providedIn: 'root',
})
export class Ecore2JsonService {

  constructor(
    private classifiers2Json: Classifier2JsonService,
  ) {}

  parse(xml: string): EPackageJson[] {
    const doc = this.parseXml(xml);
    const docElem = doc.documentElement;

    const result: EPackageJson[] = [];

    // TODO: When subpackage support is added, we must detect eSubpackages
    // and attach them to their parent EPackage instead of treating them
    // as independent top-level packages.


    const stack: Element[] = [docElem];

    while (stack.length > 0) {
      const el = stack.pop()!;

      if (this.isEPackage(el)) {
        result.push(this.parsePackage(el));
      } else {
        // Not a package → continue scanning children
        for (const child of Array.from(el.children)) {
          stack.push(child);
        }
      }
    }
    return result;
  }

  private isEPackage(el: Element): boolean {
    const tag = el.tagName;
    const type = el.getAttribute('xmi:type') ?? '';
    return tag.endsWith('EPackage') || type.endsWith('EPackage');
  }

  parsePackage(root: Element): EPackageJson {
    if (!root.tagName.endsWith('EPackage')) {
      throw new Error('Not an EPackage');
    }
    const name = root.getAttribute('name') ?? ''

    const pkg: EPackageJson = {
      name: name,
      pascalizedName: this.pascalCase(name),
      nsURI: root.getAttribute('nsURI') ?? '',
      nsPrefix: root.getAttribute('nsPrefix') ?? '',
      eClasses: [],
      eEnums: [],
      eDataTypes: [],
    };

    const idToName = new Map<string, string>();
    for (const child of Array.from(root.children)) {
      if (child.tagName === 'eClassifiers') {
        const id = child.getAttribute('xmi:id');
        const name = child.getAttribute('name');
        if (id && name) {
          idToName.set(id, name);
        }
      }
    }

    console.error("Map:");
    for (const [key, value] of idToName.entries()) {
      console.error("  " + key + " → " + value);
    }

    let index = 0
    for (const child of Array.from(root.children)) {
      if (child.tagName === 'eClassifiers') {
        const type = child.getAttribute('xsi:type');

        if (type === 'ecore:EClass') {
          const cls = this.classifiers2Json.parseEClass(child, index, idToName);
          pkg.eClasses.push(cls);
        } else if (type === 'ecore:EEnum') {
          const en = this.classifiers2Json.parseEEnum(child, index);
          pkg.eEnums.push(en);
        } else if (type === 'ecore:EDataType') {
          const dt = this.classifiers2Json.parseEDataType(child, index);
          pkg.eDataTypes.push(dt);
        }
        index++
      }
    }
    this.inferTreeParents(pkg)
    this.resolveSuperTypes(pkg)
    return pkg;
  }

  resolveSuperTypes(pkg: EPackageJson) {
    for (const cls of pkg.eClasses) {
      cls.superTypes2.map(sup => {
        const resolved = this.resolveSuperTypeUri(sup.originalRef, pkg)
        if (resolved) {
          sup.resolvedRef = {
            name: resolved
            //todo pkg?
          }
        }
      })
      cls.resolvedSuperTypes = cls.superTypes2
        .filter(sup => sup.resolvedRef != undefined)
        .map(ref => ref.resolvedRef!.name) // todo
    }
  }

  private resolveSuperTypeUri(uri: string, pkg: EPackageJson): string | undefined {
    // Case 1: XMI index "#/0/@eClassifiers.1"
    const match = uri.match(/@eClassifiers\.(\d+)/);
    if (match) {
      const index = Number(match[1]);
      const cls = pkg.eClasses.find(c => c._index === index);
      return cls?.name;
    }

    // Case 2: "#//Person" plus now also /1/Person
    if (uri.includes('/')) {
      const name = uri.split('/').pop()!;
      return pkg.eClasses.some(c => c.name === name) ? name : undefined;
    }
    //done also remove any /? since name is the last one behind it?

    // Case 3: "ecore:Person"
    if (uri.includes(':')) {
      const name = uri.split(':').pop()!;
      return pkg.eClasses.some(c => c.name === name) ? name : undefined;
    }
    return undefined;
  }


  inferTreeParents(pkg: EPackageJson) {
    // Build a lookup table following the opposite naming schema
    const refIndex = new Map<string, EReferenceJson>();
    for (const cls of pkg.eClasses) {
      for (const ref of cls.references) {
        refIndex.set(`#//${cls.name}/${ref.name}`, ref);
      }
    }
    // Now resolve opposites and infer tree-parent
    for (const cls of pkg.eClasses) {
      for (const ref of cls.references) {
        if (!ref.opposite) {
          continue;
        }
        const oppositeRef = refIndex.get(ref.opposite);
        // A reference is a tree parent iff its opposite is containment
        if (oppositeRef?.containment === true) {
          ref.isTreeParent = true;
        }
      }
    }
  }

  private pascalCase(str: string): string {
    return str
      .split(/[_\s-]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  private parseXml(xml: string): Document {
    const parser = new DOMParser();
    const dom = parser.parseFromString(xml, 'application/xml');
    const error = dom.querySelector('parsererror');
    if (error) {
      throw new Error('The uploaded file is not valid XML.');
    }
    return dom;
  }
}
