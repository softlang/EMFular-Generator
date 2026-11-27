import { Injectable } from '@angular/core';
import {EClassJson, EDataTypeJson, EEnumJson} from './ecore-json';
import {Attribute2JsonService} from './attribute2json.service';
import {Reference2JsonService} from './reference2json.service';
import {DocumentReferenceResolver} from './reference-resolving.service';

@Injectable({
  providedIn: 'root',
})
export class Classifier2JsonService {

  constructor(
    private attribute2json: Attribute2JsonService,
    private reference2json: Reference2JsonService,
  ) {}

  parseEClass(el: Element, resolver: DocumentReferenceResolver): EClassJson {
    const cls: EClassJson = {
      kind: 'EClass',
      name: el.getAttribute('name') ?? '',
      abstract: el.getAttribute('abstract') === 'true',
      interfaceLike: el.getAttribute('interface') === 'true',
      resolvedSuperTypes: resolver.resolveAllNames(el.getAttribute('eSuperTypes') ?? ''),
      attributes: [],
      references: [],
    };

    for (const child of Array.from(el.children)) {
      const type = child.getAttribute('xsi:type');
      if (type === 'ecore:EAttribute') {
        cls.attributes.push(
          this.attribute2json.parseEAttribute(child, resolver)
        );
      } else if (type === 'ecore:EReference') {
        cls.references.push(
          this.reference2json.parseEReference(child, resolver)
        );
      }
    }
    return cls;
  }

  parseEEnum(el: Element): EEnumJson {
    return {
      kind: 'EEnum',
      name: el.getAttribute('name') ?? '',
      literals: Array.from(el.children)
        .filter(c => c.tagName === 'eLiterals')
        .map(c => c.getAttribute('name') ?? ''),
    };
  }

  parseEDataType(el: Element): EDataTypeJson {
    return {
      kind: 'EDataType',
      name: el.getAttribute('name') ?? '',
      instanceTypeName: el.getAttribute('instanceTypeName') ?? '',
    };
  }

}
