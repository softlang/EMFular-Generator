import { Injectable } from '@angular/core';
import {EAttributeJson, EClassJson, EEnumJson, EPackageJson} from '../../parsing/ecore-json';
import { TemplateLoadService } from '../../utils/template-load.service';
import { PlaceholderReplacerService } from '../../utils/place-holder-replacer.service';
import { ZipService } from '../../utils/zip.service';

@Injectable({
  providedIn: 'root',
})
export class ClassGenerationService {

  private srcFolder = 'assets/templates/model/v10/core/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateClasses(model: EPackageJson) {
    const classTemplate = await this.loader.loadTemplate(
      this.srcFolder + 'class.ts.template.ts'
    );
    const targetFolder = `src/app/${model.name}/core/`

    const classMap = new Map(model.eClasses.map(c => [c.name, c]));

    for (const cls of model.eClasses) {
      if (cls.interfaceLike) continue; // interfaces handled on interface service

      const fileContent = this.buildClassFile(cls, classMap, model, classTemplate);
      this.zip.addFile(`${targetFolder}/${cls.name}.ts`, fileContent);
    }
  }

  private buildClassFile(
    cls: EClassJson,
    classMap: Map<string, EClassJson>,
    model: EPackageJson,
    template: string
  ): string {

    //distinguish interfaces and real classes on super:
    const [interfaces, realClasses] = cls.resolvedSuperTypes.reduce(
      ([i, r], name) => {
        const sup = classMap.get(name)!;
        if (sup.interfaceLike) i.push(name);
        else r.push(name);
        return [i, r];
      },
      [[], []] as [string[], string[]]
    );


    // implements:
    const IMPLEMENTS = interfaces.length > 0
      ? `implements ${interfaces.join(', ')}`
      : '';

    // real parent (extends)
    const realParent = realClasses[0] ?? null;
    const EXTENDS = realParent ?? 'Referencable<any>';

    const IMPORTS = this.buildImports(cls, interfaces, realParent, model);

    const ATTRIBUTES = this.buildAttributes(cls, model.eEnums);
    const REFERENCES = this.buildReferences(cls);

    return this.replacer.applyPlaceholders(template, {
      IMPORTS,
      modelMeta: `${model.name}Meta`,
      className: cls.name,
      EXTENDS,
      IMPLEMENTS,
      ATTRIBUTES,
      REFERENCES,
    });
  }

  private buildImports(cls: EClassJson, interfaces: string[], realParent: string|null, model: EPackageJson): string {
    const imports = new Set<string>();
    // interface supertypes (type-only)
    interfaces.forEach(i =>
      imports.add(`import type { ${i} } from './${i}';`)
    );
    // referenced types (type-only), but skip real parent and self
    cls.references.forEach(ref => {
      if (ref.type === realParent) return;
      if (ref.type === cls.name) return;
      imports.add(`import type { ${ref.type} } from './${ref.type}';`);
    });
    //modelList if needed (type-only)
    if (cls.references.some(r => r.upperBound !== 1)) {
      imports.add(`import type { ModelList } from 'emfular';`);
    }
    // meta:
    imports.add(`import { ${model.name}Meta, ${cls.name}Refs } from './_meta_';`)

    if (realParent) {
      imports.add(`import { ${realParent} } from './${realParent}';`);
    } else {
      imports.add(`import { Referencable } from 'emfular';`);
    }

    return Array.from(imports).join('\n');
  }

  private buildReferences(cls: EClassJson): string {
    return cls.references
      .map(ref => {
        const type = ref.upperBound === 1
          ? ref.type
          : `ModelList<${ref.type}>`;

        return `  @reference(${cls.name}Refs.${ref.name})\n  declare ${ref.name}: ${type};`;
      })
      .join('\n\n');
  }

  private buildAttributes(cls: EClassJson, enums: EEnumJson[]): string {
    return cls.attributes
      .map(a => this.buildAttribute(a, enums) )
      .join('\n\n');
  }

  private buildAttribute(attr: EAttributeJson,  enums: EEnumJson[]): string {
      const tsType = this.mapEcoreTypeToTs(attr);
      const optional = attr.lowerBound === 0 ? "?" : "";
      const enumInfo = this.findEnum(tsType, enums); // detect ONCE

      const initializer = enumInfo
      ? this.buildEnumInitializer(attr, enumInfo)
      : this.buildPrimitiveInitializer(attr, tsType);
      return `\t@attribute()\n\t${attr.name}${optional}: ${tsType}${initializer};`;
  }

  private mapEcoreTypeToTs(attr: EAttributeJson): string {
    const t = attr.type;

    if (t.endsWith("#//EString")) return "string";
    if (t.endsWith("#//EBoolean") || t.endsWith("#//EBooleanObject")) return "boolean";

    if (
      t.endsWith("#//EInt") || t.endsWith("#//EIntegerObject") ||
      t.endsWith("#//ELong") || t.endsWith("#//EShort") ||
      t.endsWith("#//EFloat") || t.endsWith("#//EDouble")
    ) return "number";

    if (t.endsWith("#//EDate")) return "Date";
    if (t.endsWith("#//EByteArray")) return "Uint8Array";

    // enum or custom datatype → short name
    const idx = t.lastIndexOf("#//");
    return idx >= 0 ? t.substring(idx + 3) : t;
  }

  private findEnum(typeName: string, enums: EEnumJson[]): EEnumJson | undefined {
    return enums.find(e => e.name === typeName);
  }

  // --- primitive types ----

  private buildPrimitiveInitializer(attr: EAttributeJson, tsType: string): string {
    if (attr.defaultValueLiteral !== undefined) {
      return " = " + this.formatPrimitiveDefault(attr, tsType);
    }
    if (attr.lowerBound === 1) {
      return " = " + this.emfPrimitiveDefault(tsType);
    }
    return "";
  }

  private formatPrimitiveDefault(attr: EAttributeJson, tsType: string): string {
    if (tsType === "string") {
      return JSON.stringify(attr.defaultValueLiteral);
    }
    return attr.defaultValueLiteral!;
  }

  private emfPrimitiveDefault(tsType: string): string {
    switch (tsType) {
      case "string": return '""';
      case "number": return "0";
      case "boolean": return "false";
      case "Date": return "null";
      case "Uint8Array": return "new Uint8Array()";
      default: return "undefined";
    }
  }

  //---- Enum handling -----
  private buildEnumInitializer(attr: EAttributeJson, e: EEnumJson): string {
    if (attr.defaultValueLiteral !== undefined) {
      return ` = ${e.name}.${attr.defaultValueLiteral}`;
    }
    if (attr.lowerBound === 1) {
      return ` = ${e.name}.${e.literals[0]}`;
    }
    return "";
  }

}
