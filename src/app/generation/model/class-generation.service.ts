import { Injectable } from '@angular/core';
import {
  EAttributeJson,
  EClassJson,
  EDataTypeJson,
  EEnumJson,
  EPackageJson,
  EReferenceJson
} from '../../parsing/ecore-json';
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

    const usedEnums: Set<string> = new Set(); //filled by attributes
    // fill both at once since same usage const usedTypes: Set<string> = new Set(); //filled by attributes

    const ATTRIBUTES = this.buildAttributes(cls, model.eEnums, usedEnums, model.eDataTypes, usedEnums);
    const REFERENCES = this.buildReferences(cls);


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

    const IMPORTS = this.buildImports(cls, interfaces, realParent, usedEnums, model);


    return this.replacer.applyPlaceholders(template, {
      IMPORTS,
      modelMeta: `${model.name}Meta`,
      className: cls.name,
      abstract: this.asAbstract(cls),
      EXTENDS,
      IMPLEMENTS,
      ATTRIBUTES,
      REFERENCES,
    });
  }

  private buildImports(
    cls: EClassJson,
    interfaces: string[],
    realParent: string|null,
    usedEnums: Set<string>,
    model: EPackageJson): string {
    const imports = new Set<string>();
    //basic import: eClass and attribuets and reference decorators if needed from emfular:
    imports.add(`import { eClass${cls.references.length>0? ', reference': ''}${cls.attributes.length>0? ', attribute': ''} } from 'emfular'`)

    // interface supertypes (type-only)
    interfaces.forEach(i =>
      imports.add(`import type { ${i} } from './${i}';`)
    );
    // referenced types (type-only), but skip real parent and self
    cls.references.forEach(ref => {
      if (ref.resolvedType === realParent) return;
      if (ref.resolvedType === cls.name) return;
      imports.add(`import type { ${ref.resolvedType} } from './${ref.resolvedType}';`);
    });
    //modelList if needed (type-only)
    if (cls.references.some(r => r.upperBound !== 1)) {
      imports.add(`import type { ModelList } from 'emfular';`);
    }
    // meta:
    imports.add(`import { ${model.name}Meta${cls.references.length> 0?`, ${cls.name}Refs`:'' }${usedEnums.size>0?", "+Array.from(usedEnums).join(", "):''} } from './_meta_';`)

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
        if(ref.derived)
          return this.buildDerivedRef(ref, cls.name)
        else
          return this.buildNormalRef(ref, cls.name)
      }).join('\n\n');
  }

  private buildNormalRef(ref: EReferenceJson, className: string) {
    const type = ref.upperBound === 1
      ? ref.resolvedType
      : `ModelList<${ref.resolvedType}>`;
    return `  @reference(${className}Refs.${ref.name})\n  declare ${ref.name}: ${type};`;
  }

  private buildDerivedRef(ref: EReferenceJson, className: string) {
    //right now just create a getter with right type:
    const type = ref.upperBound === 1
      ? ref.resolvedType+(ref.lowerBound!==1?"|undefined":"")
      : ref.resolvedType+"[]"
    const notImplemented = "throw new Error('Method not implemented.'); //TODO"
    return `  get ${ref.name}(): ${type} {\n\t\t${notImplemented}\n  }\n`;
  }

  //fills used enums
  private buildAttributes(cls: EClassJson, enums: EEnumJson[], usedEnums: Set<string>, types: EDataTypeJson[], usedTypes: Set<string>): string {
    console.error('Types: ## '+types.map(t => t.name))

    return cls.attributes
      .map(a => this.buildAttribute(a, enums, usedEnums, types, usedTypes) )
      .join('\n\n');
  }

  private buildAttribute(attr: EAttributeJson,  enums: EEnumJson[], usedEnums: Set<string>, eDataTypes: EDataTypeJson[], usedTypes: Set<string>): string {
      const tsType = this.mapEcoreTypeToTs(attr);
      const optional = attr.lowerBound === 0 ? "?" : "";
      const isList =  attr.upperBound === -1 || attr.upperBound > 1
      const typeShortcut = eDataTypes.find(t => t.name == tsType)
      if (typeShortcut) {
        usedTypes.add(typeShortcut.name)
      }
      const enumInfo = this.findEnum(tsType, enums);
      if (enumInfo) {
        usedEnums.add(enumInfo.name)
      }
      const initializer = enumInfo
      ? this.buildEnumInitializer(attr, enumInfo, isList)
      : this.buildPrimitiveInitializer(attr, tsType, isList);

      return `  @attribute()\n  ${attr.name}${optional}: ${tsType}${initializer};`;
  }

  private mapEcoreTypeToTs(attr: EAttributeJson): string {
    const t = attr.type;

    if (t.endsWith("#//EString")) return "string";
    if (t.endsWith("#//EBoolean") || t.endsWith("#//EBooleanObject")) return "boolean";

    if (
      t.endsWith("#//EInt") || t.endsWith("#//EIntegerObject") ||
      t.endsWith("#//ELong") || t.endsWith('#//ELongObject') ||
      t.endsWith("#//EShort") || t.endsWith("#//EShortObject") ||
      t.endsWith("#//EFloat") || t.endsWith("#//EFloatObject") ||
      t.endsWith("#//EDouble") || t.endsWith("#//EDoubleObject")
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

  private parseMultiDefault(multiDefault: string): string[] {
    return multiDefault
      .split(",")
      .map(s => s.trim())  // remove whitespace
      .filter(s => s.length > 0);
  }

  // --- primitive types ----

  private buildPrimitiveInitializer(attr: EAttributeJson, tsType: string, isList: boolean): string {
    if (attr.defaultValueLiteral !== undefined) {
      return " = " + this.formatPrimitiveDefault(attr.defaultValueLiteral, tsType, isList);
    }
    if (attr.lowerBound === 1) {
      return " = " + this.emfPrimitiveDefault(tsType, isList);
    }
    return "";
  }

  private formatPrimitiveDefault(defaultAttr: string, tsType: string, isList: boolean): string {
    if (tsType === "string") {
      if(isList) {
        this.parseMultiDefault(defaultAttr)
      } else
        return JSON.stringify(defaultAttr);
    }
    return defaultAttr;
  }

  private emfPrimitiveDefault(tsType: string, isList: boolean): string {
    if(isList) {
      return "[]"
    }
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
  private buildEnumInitializer(attr: EAttributeJson, e: EEnumJson, isList: boolean): string {
    if(isList) {
      return this.buildEnumListInitializer(attr, e)
    } else {
      return this.buildEnumSingleInitializer(attr, e)
    }
  }

  private buildEnumListInitializer(attr: EAttributeJson, e: EEnumJson): string {
    if (attr.defaultValueLiteral !== undefined) {
      const valuesStr = this.parseMultiDefault(attr.defaultValueLiteral)
        .map(v => this.getEnumValue(v, e))
        .join(", ")
      return ` = [${valuesStr}]`;
    }
    if (attr.lowerBound === 1) {
      return ` = []`;
    }
    return "";
  }

  private buildEnumSingleInitializer(attr: EAttributeJson, e: EEnumJson): string {
    if (attr.defaultValueLiteral !== undefined) {
      return ` = ${this.getEnumValue(attr.defaultValueLiteral, e)}`;
    }
    if (attr.lowerBound === 1) {
      return ` = ${this.getEnumDefault(e)}`;
    }
    return "";
  }

  getEnumDefault(e: EEnumJson): string {
    return `${e.name}.${e.literals[0]}`;
  }

  getEnumValue(value: string, e: EEnumJson): string {
    return ` = ${e.name}.${value}`; //todo could sanitize/check
  }

  asAbstract(meta:EClassJson): string {
    return meta.abstract?" abstract ": " "
  }
}
