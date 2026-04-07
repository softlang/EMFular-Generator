import { Injectable } from '@angular/core';
import {EClassifierJson, EClassJson, EDataTypeJson, EEnumJson} from '../ecore-json';
import {Attribute2JsonService} from './attribute2json.service';
import {Reference2JsonService} from './reference2json.service';

@Injectable({
  providedIn: 'root',
})
export class Classifier2JsonService {

  constructor(
    private attribute2json: Attribute2JsonService,
    private reference2json: Reference2JsonService,
  ) {}

  parseEClass(el: Element, index: number, idToName: Map<string,string>): EClassJson {
    const general = this.parseClassifier(el, index);
    const cls: EClassJson = {
      ...general,
      kind: 'EClass',
      abstract: el.getAttribute('abstract') === 'true',
      interfaceLike: el.getAttribute('interface') === 'true',
      superTypes2: (el.getAttribute('eSuperTypes') ?? '')
        .split(' ')
        .map(value => { return {originalRef: value} }),
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
    return{
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
      name: name??'', //todo
    }
    const id: string | null = el.getAttribute('xmi:id')
    if (id) {
      res._id = id
    }
    return res;
  }

}
