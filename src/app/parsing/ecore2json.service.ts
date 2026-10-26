import { Injectable } from '@angular/core';
import { EPackageJson } from './ecore-json';
import { Classifier2JsonService } from './classifier2json.service';
import { ReferenceResolvingService } from './reference-resolving.service';
import { SymbolTable } from './symbol-table';

@Injectable({
  providedIn: 'root',
})
export class Ecore2JsonService {
  constructor(
    private classifiers2Json: Classifier2JsonService,
    private referenceResolver: ReferenceResolvingService,
  ) {}

  /** Returns the root packages; subpackages are nested in `subPackages`. */
  parse(xml: string): EPackageJson[] {
    const doc = this.parseXml(xml);
    const table = this.referenceResolver.buildSymbolTable(doc);
    return this.referenceResolver
      .rootPackages(doc)
      .map((root) => this.parsePackage(root.element, table));
  }

  parsePackage(root: Element, table: SymbolTable): EPackageJson {
    const name = root.getAttribute('name') ?? '';

    const pkg: EPackageJson = {
      name,
      pascalizedName: this.pascalCase(name),
      nsURI: root.getAttribute('nsURI') ?? '',
      nsPrefix: root.getAttribute('nsPrefix') ?? '',
      eClasses: [],
      eEnums: [],
      eDataTypes: [],
    };

    let index = 0;
    for (const child of Array.from(root.children)) {
      if (child.tagName === 'eClassifiers') {
        const type = child.getAttribute('xsi:type');
        if (type === 'ecore:EClass') {
          const cls = this.classifiers2Json.parseEClass(child, index, table);
          pkg.eClasses.push(cls);
        } else if (type === 'ecore:EEnum') {
          const en = this.classifiers2Json.parseEEnum(child, index);
          pkg.eEnums.push(en);
        } else if (type === 'ecore:EDataType') {
          const dt = this.classifiers2Json.parseEDataType(child, index);
          pkg.eDataTypes.push(dt);
        }
        index++;
      } else if (child.tagName === 'eSubpackages') {
        (pkg.subPackages ??= []).push(this.parsePackage(child, table));
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
