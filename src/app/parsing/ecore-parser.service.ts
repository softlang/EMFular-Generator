import { Injectable } from '@angular/core';
import {
  EPackageJson,
  EReferenceJson,
} from './ecore-json';
import {EPackage2JsonService} from './x2json/epackage2json.service';
import {ReferenceResolvingService} from './reference-resolving.service';

@Injectable({
  providedIn: 'root',
})
export class EcoreParserService {

  constructor(
    private ePackage2Json: EPackage2JsonService,
    private referenceResolver: ReferenceResolvingService,
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
      this.referenceResolver.resolveOnPkg(pkg)
      this.inferTreeParents(pkg)
      this.referenceResolver.resolveSuperTypes(pkg)
    })
    return result;
  }

  private isEPackage(el: Element): boolean {
    const tag = el.tagName;
    const type = el.getAttribute('xmi:type') ?? '';
    return tag.endsWith('EPackage') || type.endsWith('EPackage');
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
