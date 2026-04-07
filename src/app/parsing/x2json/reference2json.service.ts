import { Injectable } from '@angular/core';
import { EReferenceJson } from '../ecore-json';

@Injectable({
  providedIn: 'root',
})
export class Reference2JsonService {

  parseEReference(el: Element): EReferenceJson {
    return {
      kind: 'EReference',
      name: el.getAttribute('name') ?? '',
      type: el.getAttribute('eType') ?? '',
      resolvedType: '', //resolved later
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),
      opposite: el.getAttribute('eOpposite') || undefined,

      // optional EMF semantics
      containment: el.getAttribute('containment') === 'true' || undefined,
      derived: el.getAttribute('derived') === 'true' || undefined,
      transient: el.getAttribute('transient') === 'true' || undefined,
      volatile: el.getAttribute('volatile') === 'true' || undefined,
      changeable: el.getAttribute('changeable') === 'true' || undefined,
    };
  }

}
