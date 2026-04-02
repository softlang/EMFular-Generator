import { Injectable } from '@angular/core';
import {EClassJson} from './ecore-json';
import {Attribute2JsonService} from './attribute2json.service';
import {Reference2JsonService} from './reference2json.service';

@Injectable({
  providedIn: 'root',
})
export class Class2JsonService {

  constructor(
    private attribute2json: Attribute2JsonService,
    private reference2json: Reference2JsonService,
  ) {}

  parseEClass(el: Element, index: number, idToName: Map<string,string>): EClassJson {
    const cls: EClassJson = {
      kind: 'EClass',
      _index: index,
      name: el.getAttribute('name') ?? '',
      abstract: el.getAttribute('abstract') === 'true',
      interfaceLike: el.getAttribute('interface') === 'true',
      superTypes: (el.getAttribute('eSuperTypes') ?? '')
        .split(' ')
        .filter(Boolean),
      resolvedSuperTypes: [],
      attributes: [],
      references: [],
    };

    for (const child of Array.from(el.children)) {
      const type = child.getAttribute('xsi:type');
      if (type === 'ecore:EAttribute') {
        cls.attributes.push(
          this.attribute2json.parseEAttribute(child, idToName)
        );
      } else if (type === 'ecore:EReference') {
        cls.references.push(
          this.reference2json.parseEReference(child, idToName)
        );
      }
    }
    return cls;
  }
}
