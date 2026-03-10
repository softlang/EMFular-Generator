import { Injectable } from '@angular/core';
import { ParsedEcoreModel } from './ecore-parser';

@Injectable({
  providedIn: 'root',
})
export class EclassesGeneratorService {
  generate(model: ParsedEcoreModel): string {
    let output = `// Auto-generated from Ecore\n`;
    output += `export enum EClasses {\n`;

    for (const cls of model.classes) {
      output += `  ${cls.name} = "${model.nsURI}#//${cls.name}",\n`;
    }

    output += `}\n`;
    return output;
  }
}