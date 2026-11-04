import { Injectable } from '@angular/core';
import { EPackageJson, ParseResult } from './ecore-json';
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

  parse(xml: string): EPackageJson[] {
    return this.parseWithDiagnostics(xml).packages;
  }

  /** Returns the root packages; subpackages are nested in `subPackages`. */
  parseWithDiagnostics(xml: string): ParseResult {
    const doc = this.parseXml(xml);
    const table = this.referenceResolver.buildSymbolTable(doc);
    const roots = this.referenceResolver.rootPackages(doc);

    if (roots.length === 0) {
      this.referenceResolver.addWarning(table, 'no-package', 'The document contains no EPackage.');
    }
    const packages = roots.map((root) => this.parsePackage(root.element, table));
    return { packages, warnings: table.warnings };
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
        const type = this.referenceResolver.typeOf(child);
        switch (type) {
          case 'EClass':
            pkg.eClasses.push(this.classifiers2Json.parseEClass(child, index, table));
            break;
          case 'EEnum':
            pkg.eEnums.push(this.classifiers2Json.parseEEnum(child, index));
            break;
          case 'EDataType':
            pkg.eDataTypes.push(this.classifiers2Json.parseEDataType(child, index));
            break;
          default:
            this.referenceResolver.addWarning(
              table,
              'unknown-element-type',
              `Skipped classifier with unsupported type '${type ?? 'none'}'`,
              child
            );
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
