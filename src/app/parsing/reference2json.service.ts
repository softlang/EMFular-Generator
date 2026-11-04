import { Injectable } from '@angular/core';
import { ReferenceResolvingService } from './reference-resolving.service';
import { EReferenceJson } from './ecore-json';
import { SymbolTable } from './symbol-table';

@Injectable({
  providedIn: 'root',
})
export class Reference2JsonService {
  constructor(private referenceResolver: ReferenceResolvingService) {}

  parseEReference(el: Element, table: SymbolTable): EReferenceJson {
    const type = el.getAttribute('eType') ?? '';
    const typeRef = this.referenceResolver.resolveClassifier(type, table);

    const opposite = el.getAttribute('eOpposite') || undefined;
    const oppositeRef = opposite
      ? this.referenceResolver.resolveFeature(opposite, table, el)
      : undefined;

    return {
      kind: 'EReference',
      name: el.getAttribute('name') ?? '',
      type,
      resolvedType: typeRef.name,
      resolvedTypeRef: typeRef,
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),

      containment: el.getAttribute('containment') === 'true' || undefined,
      derived: el.getAttribute('derived') === 'true' || undefined,
      transient: el.getAttribute('transient') === 'true' || undefined,
      volatile: el.getAttribute('volatile') === 'true' || undefined,
      changeable: el.getAttribute('changeable') === 'true' || undefined,

      opposite,
      resolvedOpposite: oppositeRef?.name || undefined,
      resolvedOppositeRef: oppositeRef,
      // a reference is a tree parent iff its opposite is the containment side
      isTreeParent: oppositeRef?.containment || undefined,
    };
  }
}
