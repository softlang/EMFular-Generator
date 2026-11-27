import { Injectable } from '@angular/core';
import {EPackageJson} from './ecore-json';
import {Classifier2JsonService} from './classifier2json.service';
import {DocumentReferenceResolver, ReferenceResolvingService} from './reference-resolving.service';

@Injectable({
  providedIn: 'root',
})
export class Ecore2JsonService {

  constructor(
    private classifiers2Json: Classifier2JsonService,
    private referenceResolving: ReferenceResolvingService,
  ) {}

  parse(xml: string): EPackageJson[] {
    const doc = this.parseXml(xml);
    const resolver = this.referenceResolving.forDocument(doc);
    return this.findTopLevelPackages(doc.documentElement, resolver);
  }

  /**
   * Collects the outermost EPackages below (and including) `el` in document
   * order. The descent stops at each package; its eSubpackages are handled
   * by parsePackage.
   */
  private findTopLevelPackages(el: Element, resolver: DocumentReferenceResolver): EPackageJson[] {
    if (this.isEPackage(el)) {
      return [this.parsePackage(el, resolver)];
    }
    return Array.from(el.children).flatMap(child => this.findTopLevelPackages(child, resolver));
  }

  private isEPackage(el: Element): boolean {
    return el.tagName.endsWith('EPackage');
  }

  private isESubpackage(el: Element): boolean {
    return el.tagName === 'eSubpackages';
  }

  parsePackage(root: Element, resolver: DocumentReferenceResolver): EPackageJson {
    if (!this.isEPackage(root) && !this.isESubpackage(root)) {
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
      subPackages: [],
    };

    for (const child of Array.from(root.children)) {
      if (child.tagName === 'eClassifiers') {
        const type = child.getAttribute('xsi:type');

        if (type === 'ecore:EClass') {
          const cls = this.classifiers2Json.parseEClass(child, resolver);
          pkg.eClasses.push(cls);
        } else if (type === 'ecore:EEnum') {
          const en = this.classifiers2Json.parseEEnum(child);
          pkg.eEnums.push(en);
        } else if (type === 'ecore:EDataType') {
          const dt = this.classifiers2Json.parseEDataType(child);
          pkg.eDataTypes.push(dt);
        }
      } else if (this.isESubpackage(child)) {
        pkg.subPackages!.push(this.parsePackage(child, resolver));
      }
    }
    return pkg;
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
