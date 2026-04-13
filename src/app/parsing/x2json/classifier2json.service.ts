import { Injectable } from '@angular/core';
import {EClassifierJson, EClassJson, EDataTypeJson, EEnumJson} from '../ecore-model/classifier';
import {StructuralFeature2JsonService} from './structural-feature2json.service';
import {ResolvableHandler} from '../resolvable-handler';

@Injectable({
  providedIn: 'root',
})
export class Classifier2JsonService {

  constructor(
    private structuralFeature2Json: StructuralFeature2JsonService,
  ) {}

  parseEClass(el: Element, index: number): EClassJson {
    const general = this.parseClassifier(el, index);
    const cls: EClassJson = {
      ...general,
      kind: 'EClass',
      abstract: el.getAttribute('abstract') === 'true',
      interfaceLike: el.getAttribute('interface') === 'true',
      superTypes: (el.getAttribute('eSuperTypes') ?? '')
        .split(' ')
        .map(value => { return ResolvableHandler.createNonNull(value) }),
      attributes: [],
      references: [],
    };

    for (const child of Array.from(el.children)) {
      const type = child.getAttribute('xsi:type');
      if (type === 'ecore:EAttribute') {
        cls.attributes.push(
          this.structuralFeature2Json.parseEAttribute(child)
        );
      } else if (type === 'ecore:EReference') {
        cls.references.push(
          this.structuralFeature2Json.parseEReference(child)
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
