import { Injectable } from '@angular/core';
import { ParsedEcoreModel, ParsedEReference } from './ecore-parser';

@Injectable({
  providedIn: 'root',
})
export class ModelGeneratorService {
  generate(model: ParsedEcoreModel): string {
    let output =
      `// Auto-generated from Ecore\n` +
      `import { attribute, eClass } from "emfular";\n` +
      `import { Referencable } from "emfular";\n` +
      `import { ReTreeListContainer } from "emfular";\n` +
      `import { EClasses } from "../eclasses";\n\n`;

    for (const cls of model.classes) {
      const containmentManyRefs = cls.references.filter((r) => r.containment && r.many);
      const otherRefs = cls.references.filter((r) => !(r.containment && r.many));

      output += `@eClass(EClasses.${cls.name})\n`;
      output += `export class ${cls.name} extends Referencable<any> {\n`;

      for (const attr of cls.attributes) {
        output += `  @attribute()\n`;
        output += `  ${attr.name}: ${attr.tsType} = ${attr.defaultValue};\n\n`;
      }

      for (const ref of containmentManyRefs) {
        output += `  public static readonly $${ref.name}Name = "${ref.name}";\n\n`;
        output += `  private _${ref.name}!: ReTreeListContainer<${ref.targetType}>;\n\n`;
      }

      for (const ref of otherRefs) {
        const type = ref.many ? `${ref.targetType}[]` : ref.targetType;
        output += `  // TODO: Reference (${ref.containment ? 'containment' : 'non-containment'})\n`;
        output += `  ${ref.name}: ${type} = ${ref.many ? '[]' : 'null as any'};\n\n`;
      }

      output += `  constructor() {\n`;
      output += `    super();\n`;

      for (const ref of containmentManyRefs) {
        output += `    this._${ref.name} = new ReTreeListContainer<${ref.targetType}>(this, ${cls.name}.$${ref.name}Name);\n`;
      }

      output += `  }\n\n`;

      for (const ref of containmentManyRefs) {
        output += this.buildContainmentMethods(ref);
      }

      output += `}\n\n`;
    }

    return output;
  }

  private buildContainmentMethods(ref: ParsedEReference): string {
    const cap = this.capitalize(ref.name);
    let output = '';

    output += `  get ${ref.name}(): ${ref.targetType}[] {\n`;
    output += `    return this._${ref.name}.get();\n`;
    output += `  }\n\n`;

    output += `  add${cap}(...items: ${ref.targetType}[]) {\n`;
    output += `    items.forEach((i) => this._${ref.name}.add(i));\n`;
    output += `  }\n\n`;

    output += `  remove${cap}(...items: ${ref.targetType}[]) {\n`;
    output += `    items.forEach((i) => this._${ref.name}.remove(i));\n`;
    output += `  }\n\n`;

    return output;
  }

  private capitalize(s: string): string {
    return s.length ? s[0].toUpperCase() + s.slice(1) : s;
  }
}