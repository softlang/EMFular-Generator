import { Injectable } from '@angular/core';
import { TemplateLoadService } from '../utils/template-load.service';
import { PlaceholderReplacerService } from '../utils/place-holder-replacer.service';
import { ZipService } from '../utils/zip.service';
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
      .map(a => this.buildAttribute(a))
      .join('\n\n');
  }

  private buildAttribute(attr: Attribute): string {
      const optional = attr.lowerBound === 0 ? "?" : "";
      const initializer = attr.defaultValueLiteral ? ' = '+attr.defaultValueLiteral : ''
      return `  @attribute()\n  ${attr.name}${optional}: ${attr.type}${initializer};`;
  }

  asAbstract(meta:EClass): string {
    return meta.abstract?" abstract ": " "
  }
}
