import { Injectable } from '@angular/core';
import { TemplateLoadService } from '../utils/template-load.service';
import { PlaceholderReplacerService } from '../utils/place-holder-replacer.service';
import { ZipService } from '../utils/zip.service';
import {EEnumJson} from '../../parsing-model/classifier';
import {EAttributeJson} from '../../parsing-model/structural-feature';
import {Package} from '../../generation-model/package';
import {EClass, EDataType, EEnum} from '../../generation-model/classifier';
import {CrossReferenceHandler} from '../../generation-model/cross-reference-handler';
import {Attribute, Reference} from '../../generation-model/structural-feature';

@Injectable({
  providedIn: 'root',
})
export class ClassGenerationService {

  private srcFolder = 'assets/utils/model-specific/v10/core/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateClasses(model: Package, modelName: string) {
    const classTemplate = await this.loader.loadTemplate(
      this.srcFolder + 'class.ts.template.ts'
    );
    const targetFolder = CrossReferenceHandler.corePathFromPath(model.path)

    for (const cls of model.classes) {
      if (cls.interfaceLike) continue; // interfaces handled on interface service
      const fileContent = this.buildClassFile(cls, model, modelName, classTemplate);
      this.zip.addFile(`${targetFolder}/${cls.name}.ts`, fileContent);
    }
  }

  private buildClassFile(
    cls: EClass,
    model: Package,
    modelName: string,
    template: string
  ): string {

    const usedEnums: Set<string> = new Set(); //filled by attributes
    // fill both at once since same usage const usedTypes: Set<string> = new Set(); //filled by attributes

    const ATTRIBUTES = this.buildAttributes(cls, model.enums, usedEnums, model.datatypes, usedEnums);
    const REFERENCES = this.buildReferences(cls);

    const EXTENDS = cls.superTypes.realParent?.name ?? 'Referencable<any>';
    const IMPLEMENTS = cls.superTypes.interfaces.length > 0
      ? `implements ${cls.superTypes.interfaces.join(', ')}`
      : '';

    const IMPORTS = this.buildImports(cls, usedEnums, modelName);


    return this.replacer.applyPlaceholders(template, {
      IMPORTS,
      modelMeta: `${modelName}Meta`,
      className: cls.name,
      abstract: this.asAbstract(cls),
      EXTENDS,
      IMPLEMENTS,
      ATTRIBUTES,
      REFERENCES,
    });
  }

  private buildImports(
    cls: EClass,
    usedEnums: Set<string>,
    modelName: string
  ): string {

    const imports = new Set<string>();

    //basic import: eClass and attributes and reference decorators if needed from emfular:
    imports.add(`import { eClass${cls.references.length>0? ', reference': ''}${cls.attributes.length>0? ', attribute': ''} } from 'emfular'`)
    //modelList if needed (type-only)
    if (cls.references.some(r => r.upperBound !== 1)) {
      imports.add(`import type { ModelList } from 'emfular';`);
    }

    const realParent = cls.superTypes.realParent;
    if (realParent) {
      imports.add(`import { ${realParent.name} } from '${CrossReferenceHandler.corePath(realParent)}';`);
    } else {
      imports.add(`import { Referencable } from 'emfular';`);
    }

    // meta:
    imports.add(`import { ${modelName}Meta${cls.references.length> 0?`, ${cls.name}Refs`:'' }${usedEnums.size>0?", "+Array.from(usedEnums).join(", "):''} } from './_meta_';`)

    // interface supertypes (type-only)
    cls.superTypes.interfaces.forEach(i =>
      imports.add(CrossReferenceHandler.typeImport(i))
    );
    // referenced types (type-only), but skip real parent and self
    cls.references.forEach(ref => {
      if (ref.type === realParent) return;
      if (ref.type.name === cls.name) return; //todo if multiple same names allowed, use alias then
      imports.add(CrossReferenceHandler.typeImport(ref.type));
    });
    return Array.from(imports).join('\n');
  }

  private buildReferences(cls: EClass): string {
    return cls.references
      .map(ref => {
        if(ref.derived)
          return this.buildDerivedRef(ref)
        else
          return this.buildNormalRef(ref, cls.name)
      }).join('\n\n');
  }

  private buildNormalRef(ref: Reference, className: string) {
    const type = ref.upperBound === 1
      ? ref.type.name
      : `ModelList<${ref.type.name}>`;
    return `  @reference(${className}Refs.${ref.name})\n  declare ${ref.name}: ${type};`;
  }

  private buildDerivedRef(ref: Reference) {
    //right now just create a getter with right type:
    const type = ref.upperBound === 1
      ? ref.type.name+(ref.lowerBound!==1?"|undefined":"")
      : ref.type.name+"[]"
    const notImplemented = "throw new Error('Method not implemented.'); //TODO"
    return `  get ${ref.name}(): ${type} {\n\t\t${notImplemented}\n  }\n`;
  }

  //fills used enums
  private buildAttributes(cls: EClass, enums: EEnum[], usedEnums: Set<string>, types: EDataType[], usedTypes: Set<string>): string {
    console.error('Types: ## '+types.map(t => t.name))

    return cls.attributes
      .map(a => this.buildAttribute(a, enums, usedEnums, types, usedTypes) )
      .join('\n\n');
  }

  private buildAttribute(attr: Attribute,  enums: EEnum[], usedEnums: Set<string>, eDataTypes: EDataType[], usedTypes: Set<string>): string {
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
    const t = attr.type.raw;

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
    //todo why not use cleaned version all the time
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

  asAbstract(meta:EClass): string {
    return meta.abstract?" abstract ": " "
  }
}
