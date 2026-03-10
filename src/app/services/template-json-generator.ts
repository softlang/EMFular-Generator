import { Injectable } from '@angular/core';
import { ParsedEcoreModel } from './ecore-parser';

@Injectable({
  providedIn: 'root',
})
export class TemplateJsonGeneratorService {
  generate(model: ParsedEcoreModel): string {
    const template = {
      nsURI: model.nsURI,
      classes: model.classes.map((c) => ({
        name: c.name,
        attributes: c.attributes.map((a) => ({
          name: a.name,
          type: a.tsType,
        })),
        references: c.references.map((r) => ({
          name: r.name,
          targetType: r.targetType,
          many: r.many,
          containment: r.containment,
        })),
      })),
    };

    return JSON.stringify(template, null, 2);
  }
}