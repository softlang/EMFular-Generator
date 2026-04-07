import { Injectable } from '@angular/core';
import {EAttributeJson} from '../ecore-json';
import { ReferenceResolvingService } from '../reference-resolving.service';

@Injectable({
  providedIn: 'root',
})
export class Attribute2JsonService {

  constructor(private referenceResolver: ReferenceResolvingService) {}

  parseEAttribute(el: Element, idToName: Map<string,string>): EAttributeJson {
    const rawType = el.getAttribute('eType') ?? ''
    const res: EAttributeJson =  {
      kind: 'EAttribute',
      name: el.getAttribute('name') ?? '',
      type: idToName.get(
        this.referenceResolver.normalizeIdRef(rawType)
      ) ?? this.referenceResolver.normalizeTypeName(rawType),
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
