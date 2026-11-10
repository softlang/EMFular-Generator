import { Injectable } from '@angular/core';
import {
  ClassifierRef,
  EAttributeJson,
  EClassJson,
  EDataTypeJson,
  EEnumJson,
  EPackageJson,
  EReferenceJson
} from '../../parsing/ecore-json';
import { TemplateLoadService } from '../utils/template-load.service';
import { PlaceholderReplacerService } from '../utils/place-holder-replacer.service';
import { ZipService } from '../utils/zip.service';
import {GenerationPaths} from '../generation-paths';
import {ImportPathCreator} from '../utils/import-path-creator';

@Injectable({
  providedIn: 'root',
})
export class ClassGenerationService {

  private srcFolder = 'assets/templates/model/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateClasses(model: EPackageJson) {
    const classTemplate = await this.loader.loadTemplate(
      this.srcFolder + 'class.ts.template.ts'
    );

    const classMap = new Map(model.eClasses.map(c => [c.name, c]));

    for (const cls of model.eClasses) {
      if (cls.interfaceLike) continue; // interfaces handled on interface service

      const fileContent = this.buildClassFile(cls, classMap, model, classTemplate);
      this.zip.addFile(`${GenerationPaths.modelPath}/${model.name}/${cls.name}.ts`, fileContent);
    }
  }

  private buildClassFile(
    cls: EClassJson,
    classMap: Map<string, EClassJson>,
    model: EPackageJson,
    template: string
  ): string {
    const ATTRIBUTES = this.buildAttributes(cls, model.eEnums);
    const REFERENCES = this.buildReferences(cls);

    //distinguish interfaces and real classes on super:
    const [interfaces, realClasses] = cls.superTypes.reduce(
      ([i, r], ref) => {
        const sup = classMap.get(ref.name)!;
        if (sup.interfaceLike) i.push(ref);
        else r.push(ref);
        return [i, r];
      },
      [[], []] as [ClassifierRef[], ClassifierRef[]]
    );

    // implements:
    const IMPLEMENTS = interfaces.length > 0
      ? `implements ${interfaces.map(i => i.name).join(', ')}`
      : '';

    // real parent (extends)
    const realParent = realClasses[0] ?? null;
    const EXTENDS = realParent.name ?? 'Referencable<any>';
    const IMPORTS = this.buildImports(cls, interfaces, realParent, model);

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
    interfaces: ClassifierRef[],
    realParent: ClassifierRef | null,
    model: EPackageJson): string {

    const ownClsRef = ImportPathCreator.cls2pkgRef(cls)
    const imports = new Set<string>();
    //basic import: eClass and attributes and reference decorators if needed from emfular:
    imports.add(`import { eClass${cls.references.length>0? ', reference': ''}${cls.attributes.length>0? ', attribute': ''} } from 'emfular-core'`)
    //modelList if needed (type-only)
    if (cls.references.some(r => r.upperBound !== 1)) {
      imports.add(`import type { ModelList } from 'emfular-core';`);
    }
    //this needs real import, not type. Use parent if it exists, Referencable otherwise
    if (realParent) {
      const parentImport = ImportPathCreator.createImportBetweenClassifiers(realParent, ownClsRef, false)
      if(parentImport) imports.add(parentImport);
    } else {
      imports.add(`import { Referencable } from 'emfular-core';`);
    }
    // interface supertypes (type-only)
    interfaces.map(i =>
      ImportPathCreator.createImportBetweenClassifiers(i, ownClsRef, true)
    ).filter(i => i != undefined).map(i => imports.add(i));
    // referenced types (type-only), but skip real parent and self
    cls.references.forEach(ref => {
      if (ref.resolvedTypeRef === realParent) return; //already covered, no double import
      if (ref.resolvedTypeRef?.name === cls.name) return;
      const importStr = ref.resolvedTypeRef?
        ImportPathCreator.createImportBetweenClassifiers(ref.resolvedTypeRef, ownClsRef, true): undefined
      if(importStr) imports.add(importStr);
    });
    // own meta:
    imports.add(
      `import { ${model.name}Meta${cls.references.length>0 ? `, ${cls.name}Refs`:'' } } from './_meta_';`)
    // all extra types from attributes:
    // enums and type aliases (could be from every pkg):
    const attrImports = this.buildImportsFromAttributes(
      cls.attributes.map(attr =>attr.resolvedTypeRef)
    )
    attrImports.forEach(attr => {
      imports.add(attr);
    })
    return Array.from(imports).join('\n');
  }

  private buildImportsFromAttributes(attributes: ClassifierRef[]): string[] {
    const grouped = new Map<string, Set<ClassifierRef>>();
    for (const attribute of attributes) {
      const key = attribute.pkgPath?.join('/') ?? '';
      if (!grouped.has(key)) {
        grouped.set(key, new Set<ClassifierRef>());
      }
      grouped.get(key)!.add(attribute);
    }
    return [...grouped].map(([path, refs]) =>
      `import { ${[...refs].map(ref => ref.name).join(',')} } from 'src/app/model/${path}/_meta_';`
    );
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
      ? ref.resolvedTypeRef?.name
      : `ModelList<${ref.resolvedTypeRef?.name}>`;
    return `  @reference(${className}Refs.${ref.name})\n  declare ${ref.name}: ${type};`;
  }

  private buildDerivedRef(ref: EReferenceJson, className: string) {
    //right now just create a getter with right type:
    const type = ref.upperBound === 1
      ? ref.resolvedTypeRef?.name+(ref.lowerBound!==1?"|undefined":"")
      : ref.resolvedTypeRef?.name+"[]"
    const notImplemented = "throw new Error('Method not implemented.'); //TODO"
    return `  get ${ref.name}(): ${type} {\n\t\t${notImplemented}\n  }\n`;
  }

  private buildAttributes(cls: EClassJson, enums: EEnumJson[]): string {
    return cls.attributes
      .map(a => this.buildAttribute(a, enums))
      .join('\n\n');
  }

  private buildAttribute(attr: EAttributeJson, enums: EEnumJson[]): string {
      const tsType = this.mapEcoreTypeToTs(attr);
      const optional = attr.lowerBound === 0 ? "?" : "";
      const isList =  attr.upperBound === -1 || attr.upperBound > 1
      const enumInfo = this.findEnum(tsType, enums);
      const initializer = enumInfo
      ? this.buildEnumInitializer(attr, enumInfo, isList)
      : this.buildPrimitiveInitializer(attr, tsType, isList);

      return `  @attribute()\n  ${attr.name}${optional}: ${tsType}${initializer};`;
  }

  private mapEcoreTypeToTs(attr: EAttributeJson): string {
    const t = attr.resolvedTypeRef.name ?? '';

    if (t.length == 0) return "any"

    if (t == "EString") return "string";
    if (t == "EBoolean" || t == "EBooleanObject") return "boolean";

    if (
      t == "EInt" || t == "EIntegerObject" ||
      t == "ELong" || t == "ELongObject" ||
      t == "EShort" || t == "EShortObject" ||
      t == "EFloat" || t == "EFloatObject" ||
      t == "EDouble" || t == "EDoubleObject"
    ) return "number";

    if (t == "EDate") return "Date";
    if (t == "EByteArray") return "Uint8Array";

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
