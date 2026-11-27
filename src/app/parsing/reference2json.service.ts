import { Injectable } from '@angular/core';
import {DocumentReferenceResolver} from './reference-resolving.service';
import {EReferenceJson} from './ecore-json';

@Injectable({
  providedIn: 'root',
})
export class Reference2JsonService {

  parseEReference(el: Element, resolver: DocumentReferenceResolver): EReferenceJson {
    const type = el.getAttribute('eType') ?? '';
    const opposite = el.getAttribute('eOpposite') || undefined;
    const oppositeEl = opposite ? resolver.resolveElement(opposite) : undefined;
    return {
      kind: 'EReference',
      name: el.getAttribute('name') ?? '',
      resolvedType: resolver.resolveName(type),
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),

      // optional EMF semantics
      containment: el.getAttribute('containment') === 'true' || undefined,
      derived: el.getAttribute('derived') === 'true' || undefined,
      transient: el.getAttribute('transient') === 'true' || undefined,
      volatile: el.getAttribute('volatile') === 'true' || undefined,
      changeable: el.getAttribute('changeable') === 'true' || undefined,

      resolvedOpposite: oppositeEl?.getAttribute('name') ?? undefined,
      // A reference is a tree parent iff its opposite is a containment
      isTreeParent: oppositeEl?.getAttribute('containment') === 'true' || undefined,
    };
  }
}
