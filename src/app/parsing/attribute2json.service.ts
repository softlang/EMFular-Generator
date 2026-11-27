import { Injectable } from '@angular/core';
import {EAttributeJson} from './ecore-json';
import { DocumentReferenceResolver } from './reference-resolving.service';

@Injectable({
  providedIn: 'root',
})
export class Attribute2JsonService {

  parseEAttribute(el: Element, resolver: DocumentReferenceResolver): EAttributeJson {
    const res: EAttributeJson =  {
      kind: 'EAttribute',
      name: el.getAttribute('name') ?? '',
      type: resolver.resolveName(el.getAttribute('eType') ?? ''),
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
