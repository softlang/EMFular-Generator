import { Injectable } from '@angular/core';
import {EAttributeJson, EReferenceJson, EStructuralFeature, Resolvable} from '../ecore-json';
import {ResolvableHandler} from '../resolvable-handler';

@Injectable({
  providedIn: 'root',
})
export class StructuralFeature2JsonService {

  private parseStructuralFeature(el: Element): EStructuralFeature {
    return {
      name: el.getAttribute('name') ?? '',
      type: {raw: el.getAttribute('eType') ?? ''},
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),
    }
  }

  parseEAttribute(el: Element): EAttributeJson {
    const structuralF = this.parseStructuralFeature(el);
    return {
      ...structuralF,
      kind: 'EAttribute',
      defaultValueLiteral: el.getAttribute('defaultValueLiteral') || undefined,
    };
  }

  parseEReference(el: Element): EReferenceJson {
    const structuralF = this.parseStructuralFeature(el)
    return {
      ...structuralF,
      kind: 'EReference',
      opposite: ResolvableHandler.create(
        el.getAttribute('eOpposite')
      ),
      containment: el.getAttribute('containment') === 'true' || undefined,
      derived: el.getAttribute('derived') === 'true' || undefined,
      transient: el.getAttribute('transient') === 'true' || undefined,
      volatile: el.getAttribute('volatile') === 'true' || undefined,
      changeable: el.getAttribute('changeable') === 'true' || undefined,
    };
  }

}
