import { Injectable } from '@angular/core';
import {EAttributeJson, EReferenceJson, EStructuralFeature} from '../ecore-json';

@Injectable({
  providedIn: 'root',
})
export class StructuralFeature2JsonService {

  private parseStructuralFeature(el: Element): EStructuralFeature {
    return {
      name: el.getAttribute('name') ?? '',
      type: el.getAttribute('eType') ?? '',
      resolvedType: '', //resolved later
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
      opposite: el.getAttribute('eOpposite') || undefined,
      containment: el.getAttribute('containment') === 'true' || undefined,
      derived: el.getAttribute('derived') === 'true' || undefined,
      transient: el.getAttribute('transient') === 'true' || undefined,
      volatile: el.getAttribute('volatile') === 'true' || undefined,
      changeable: el.getAttribute('changeable') === 'true' || undefined,
    };
  }

}
