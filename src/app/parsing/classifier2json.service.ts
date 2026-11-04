import { Injectable } from '@angular/core';
import { EClassifierJson, EClassJson, EDataTypeJson, EEnumJson } from './ecore-json';
import { Attribute2JsonService } from './attribute2json.service';
import { Reference2JsonService } from './reference2json.service';
import { ReferenceResolvingService } from './reference-resolving.service';
import { SymbolTable } from './symbol-table';

@Injectable({
  providedIn: 'root',
})
export class Classifier2JsonService {
  constructor(
    private attribute2json: Attribute2JsonService,
    private reference2json: Reference2JsonService,
    private referenceResolver: ReferenceResolvingService,
  ) {}

  parseEClass(el: Element, index: number, table: SymbolTable): EClassJson {
    const general = this.parseClassifier(el, index);
    const superTypes = this.referenceResolver.splitRefList(el.getAttribute('eSuperTypes') ?? '').map((s) => this.referenceResolver.resolveClassifier(s, table, el));

    const cls: EClassJson = {
      ...general,
      kind: 'EClass',
      abstract: el.getAttribute('abstract') === 'true',
      interfaceLike: el.getAttribute('interface') === 'true',
      superTypes,
      attributes: [],
      references: [],
    };

    for (const child of Array.from(el.children)) {
      if (child.tagName !== 'eStructuralFeatures') continue;
      const type = this.referenceResolver.typeOf(child);
      switch (type) {
        case 'EAttribute':
          cls.attributes.push(this.attribute2json.parseEAttribute(child,table));
          break;
        case 'EReference':
          cls.references.push(this.reference2json.parseEReference(child,table));
          break;
        default:
          this.referenceResolver.addWarning(
            table,
            'unknown-element-type',
            `Skipped feature with unsupported type '${type ?? 'none'}'`,
            child
          );
      }
    }
    return cls;
  }

  parseEEnum(el: Element, index: number): EEnumJson {
    const general = this.parseClassifier(el, index);
    return {
      ...general,
      kind: 'EEnum',
      literals: Array.from(el.children)
        .filter(c => c.tagName === 'eLiterals')
        .map(c => c.getAttribute('name') ?? ''),
    };
  }

  parseEDataType(el: Element, index: number): EDataTypeJson {
    const general = this.parseClassifier(el, index);
    return {
      ...general,
      kind: 'EDataType',
      instanceTypeName: el.getAttribute('instanceTypeName') ?? '',
    };
  }

  private parseClassifier(el: Element, index: number): EClassifierJson {
    const name: string | null = el.getAttribute('name');
    const res: EClassifierJson = {
      _index: index,
      _rawName: name ?? '',
      name: name ?? '', //todo
    };
    const id: string | null = el.getAttribute('xmi:id');
    if (id) {
      res._id = id;
    }
    return res;
  }
}
