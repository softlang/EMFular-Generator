import { Injectable } from '@angular/core';
import {EReferenceJson} from '../ecore-json';

@Injectable({
  providedIn: 'root',
})
export class Reference2JsonService {

  parseEReference(el: Element): EReferenceJson {
    const type = el.getAttribute('eType') ?? '';
    const opposite = el.getAttribute('eOpposite') || undefined
    return {
      kind: 'EReference',
      name: el.getAttribute('name') ?? '',
      type: type,
      resolvedType: '', //resolved later
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),

      // optional EMF semantics
      containment: el.getAttribute('containment') === 'true' || undefined,
      derived: el.getAttribute('derived') === 'true' || undefined,
      transient: el.getAttribute('transient') === 'true' || undefined,
      volatile: el.getAttribute('volatile') === 'true' || undefined,
      changeable: el.getAttribute('changeable') === 'true' || undefined,

      // opposite reference (if present)
      opposite: opposite,
      resolvedOpposite: this.normalizeOpposite(opposite),
    };
  }

  //we can resolve here, since we do neither expect id-based, nor positional references
  private normalizeOpposite(raw: string|undefined): string|undefined {
    if (!raw ) return undefined;
    const idx = raw.lastIndexOf("/");
    return idx >= 0 ? raw.substring(idx + 1) : raw;
  }

}
