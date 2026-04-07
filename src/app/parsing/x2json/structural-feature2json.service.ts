import { Injectable } from '@angular/core';
import {EAttributeJson, EReferenceJson} from '../ecore-json';

@Injectable({
  providedIn: 'root',
})
export class StructuralFeature2JsonService {

  parseEAttribute(el: Element): EAttributeJson {
    const rawType = el.getAttribute('eType') ?? ''
    const res: EAttributeJson =  {
      kind: 'EAttribute',
      name: el.getAttribute('name') ?? '',
      type: rawType,
      resolvedType: '', //resolved later
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),
    };
    const defaultValue = el.getAttribute('defaultValueLiteral');
    if (defaultValue !== null) {
      res.defaultValueLiteral = defaultValue;
    }
    return res;
  }

  parseEReference(el: Element): EReferenceJson {
    return {
      kind: 'EReference',
      name: el.getAttribute('name') ?? '',
      type: el.getAttribute('eType') ?? '',
      resolvedType: '', //resolved later
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),

      opposite: el.getAttribute('eOpposite') || undefined,
      containment: el.getAttribute('containment') === 'true' || undefined,
      derived: el.getAttribute('derived') === 'true' || undefined,
      transient: el.getAttribute('transient') === 'true' || undefined,
      volatile: el.getAttribute('volatile') === 'true' || undefined,
      changeable: el.getAttribute('changeable') === 'true' || undefined,
    };
  }

}
