import { Injectable } from '@angular/core';
import { EAttributeJson } from './ecore-json';
import { ReferenceResolvingService } from './reference-resolving.service';
import { SymbolTable } from './symbol-table';

@Injectable({
  providedIn: 'root',
})
export class Attribute2JsonService {
  constructor(private referenceResolver: ReferenceResolvingService) {}

  parseEAttribute(el: Element, table: SymbolTable): EAttributeJson {
    const typeRef = this.referenceResolver.resolveClassifier(el.getAttribute('eType') ?? '', table);
    const res: EAttributeJson = {
      kind: 'EAttribute',
      name: el.getAttribute('name') ?? '',
      type: typeRef.name,
      resolvedTypeRef: typeRef,
      lowerBound: Number(el.getAttribute('lowerBound') ?? '0'),
      upperBound: Number(el.getAttribute('upperBound') ?? '1'),
    };
    const defaultValue = el.getAttribute('defaultValueLiteral');
    if (defaultValue !== null) {
      res.defaultValueLiteral = defaultValue;
    }
    return res;
  }
}
