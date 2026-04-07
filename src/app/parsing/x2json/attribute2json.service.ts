import { Injectable } from '@angular/core';
import {EAttributeJson} from '../ecore-json';
import { ReferenceResolvingService } from '../reference-resolving.service';

@Injectable({
  providedIn: 'root',
})
export class Attribute2JsonService {

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
}
