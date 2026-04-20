import { Injectable } from '@angular/core';
import {TemplateLoadService} from '../../utils/template-load.service';
import {PlaceholderReplacerService} from '../../utils/place-holder-replacer.service';
import {ZipService} from '../../utils/zip.service';
import {Package} from '../../synthesis-model/package';
import {EClass} from '../../synthesis-model/classifier';
import {Reference} from '../../synthesis-model/structural-feature';
import {CrossReferenceHandler} from '../../synthesis-model/cross-reference-handler';

@Injectable({
  providedIn: 'root',
})
export class MetaGenerationService {

  private srcFolder = 'assets/templates/model/v10/meta/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateMeta(model: Package, modelName: string) {
    const refsBlocks = this.buildAllClassRefs(model);
    const modelMeta = await this.buildModelMeta(model, modelName, refsBlocks);

    const outputFolder = `@core/`

    this.zip.addFile(`${outputFolder}/_meta_.ts`, modelMeta);
  }

  private buildEnums(model: Package): string {
    return model.enums
      .map(e =>
        `export enum ${e.name} {\n` +
        e.literals.map(lit => `  ${lit} = "${lit}",`).join("\n") +
        `\n}`
      )
      .join("\n");
  }

  private buildTypes(model: Package): string {
    return model.datatypes
      .map(e =>
        `export type ${e.name} = any;`  //todo just aliases, currently all to any = Object
      ).join("\n");
  }


  private buildAllClassRefs(model: Package): string {
    let refs_list = [];
    for (const classEntry of model.classes) {
      refs_list.push(
        this.buildClassRef(classEntry)
      )
    }
    return refs_list.join('\n');
  }

  private buildClassRef(classDef: EClass): string {
    let REFS_list: string[] = []
    for (const refEntry of classDef.references) {
      REFS_list.push(
        this.buildRefEntry(refEntry)
      )
    }
    let REFS = REFS_list.join(",\n")
    if (REFS_list.length > 0) {
      REFS+="\n"
    }
    return this.replacer.applyPlaceholders(
      'export const %%className%%Refs = {\n' +
      '%%REFS%%};',
      {
        className: classDef.name,
        REFS: REFS,
      })
  }

  private buildRefEntry(ref: Reference): string {
    //needs inlining since empty last lines cause strange look
    return this.replacer.applyPlaceholders(
      '\t%%refName%%: {\n' +
      '\t%%CONTENT%%\n' +
      '\t} satisfies ReferenceMeta',
      {
        refName: ref.name,
        CONTENT: this.buildCONTENT(ref)
      })
  }

  //indented
  private buildCONTENT(ref: Reference): string {
    const lines: string[] = [];
    lines.push(`\ttarget: ${CrossReferenceHandler.createEClass(ref.type)}`);
    lines.push(`max: ${ref.upperBound?ref.upperBound:1}`)
    if (ref.lowerBound !== undefined && ref.lowerBound !== 0) {
      lines.push(`min: ${ref.lowerBound}`);
    }
    if (ref.containment) {
      lines.push(`containment: true`);
    }
    if (ref.isTreeParent) {
      lines.push(`isParent: true`);
    }
    if(ref.opposite) {
      lines.push(`opposite: "${ref.opposite}"`);
    }
    if(ref.derived) { //todo can we use it on 10.1?
      //lines.push(`derivingMethod: Symbol("${className}.${ref.name}.compute")`);
      lines.push(`//derived`);
    }
    return lines.join(",\n\t\t"); //hence first entry needs extra indentation
  }

  private async buildModelMeta(model: Package, modelName: string, CLASS_REFS: string): Promise<string> {
    const modelMetaTemplate = await this.loader.loadTemplate(this.srcFolder+"model-meta.ts.template.ts");

    const classEntries = model.classes
      .map(cls => `${cls.name}: { references: ${cls.name}Refs },`)
      .join("\n\t\t");

    return this.replacer.applyPlaceholders(modelMetaTemplate, {
      modelName: modelName,
      prefix: model.nsPrefix,
      uri: model.nsURI,
      CLASS_ENTRIES: "\t"+classEntries,
      CLASS_REFS: CLASS_REFS,
      TYPES: this.buildTypes(model),
      ENUMS: this.buildEnums(model)
    });
  }

}

