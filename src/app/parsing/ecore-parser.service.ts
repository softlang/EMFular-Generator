import { Injectable } from '@angular/core';
import { EPackageJson } from './ecore-model/package';
import { EPackage2JsonService } from './x2json/epackage2json.service';
import { ReferenceResolvingService } from './resolving/reference-resolving.service';

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
    const stack: Element[] = [doc.documentElement];
    const result: EPackageJson[] = [];

    //1) parse as raw, no reference resolving yet:
    while (stack.length > 0) {
      const el = stack.pop()!;
      if (this.isEPackage(el)) {
        result.push(this.ePackage2Json.parsePackage(el));
      } else { // Not a package, continue scanning children
        for (const child of Array.from(el.children)) {
          stack.push(child);
        }
      }
    }
    // 2) now resolve ALL references/additional attributes
    this.referenceResolver.resolveOnPkgs(result)
    return result;
  }

  private isEPackage(el: Element): boolean {
    const tag = el.tagName;
    const type = el.getAttribute('xmi:type') ?? '';
    return tag.endsWith('EPackage') || type.endsWith('EPackage');
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
