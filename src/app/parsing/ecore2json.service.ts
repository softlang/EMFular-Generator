import { Injectable } from '@angular/core';
import {
  EPackageJson,
  EReferenceJson,
} from './ecore-json';
import {EPackage2JsonService} from './epackage2json.service';

@Injectable({
  providedIn: 'root',
})
export class Ecore2JsonService {

  constructor(
    private ePackage2Json: EPackage2JsonService,
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
        result.push(this.ePackage2Json.parsePackage(el));
      } else {
        // Not a package → continue scanning children
        for (const child of Array.from(el.children)) {
          stack.push(child);
        }
      }
    }

    //now resolve ALL references (later take all as knowledge input):
    result.map((pkg: EPackageJson) => {
      this.inferTreeParents(pkg)
      this.resolveSuperTypes(pkg)
    })
    return result;
  }

  private isEPackage(el: Element): boolean {
    const tag = el.tagName;
    const type = el.getAttribute('xmi:type') ?? '';
    return tag.endsWith('EPackage') || type.endsWith('EPackage');
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
