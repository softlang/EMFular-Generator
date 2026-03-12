import { Injectable } from '@angular/core';
import {EClassJson, EPackageJson, EReferenceJson} from '../../parsing/ecore-json';
import {TemplateLoadService} from '../../utils/template-load.service';
import {PlaceholderReplacerService} from '../../utils/place-holder-replacer.service';
import {ZipService} from '../../utils/zip.service';

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

  async generateMeta(model: EPackageJson) {
    const refsBlocks = await this.buildAllClassRefs(model);
    const modelMeta = await this.buildModelMeta(model, refsBlocks);

    const outputFolder = `src/app/${model.name}/core/`

    this.zip.addFile(`${outputFolder}/_meta_.ts`, modelMeta);
  }

  private buildEnums(model: EPackageJson): string {
    return model.eEnums
      .map(e =>
        `export enum ${e.name} {\n` +
        e.literals.map(lit => `  ${lit} = "${lit}",`).join("\n") +
        `\n}`
      )
      .join("\n");
  }


  private async buildAllClassRefs(model: EPackageJson): Promise<string> {
    const refEntryTemplate = await this.loader.loadTemplate(this.srcFolder+"REF_ENTRY.template.ts");
    const classRefsTemplate = await this.loader.loadTemplate(this.srcFolder+"CLASS_REFS.template.ts");

    let refs_list = [];
    for (const classEntry of model.eClasses) {
      refs_list.push(
        this.buildClassRef(classEntry, refEntryTemplate, classRefsTemplate)
      )
    }
    return refs_list.join('\n');
  }

  private buildClassRef(classDef: EClassJson, refEntryTemplate: string, classRefsTemplate: string ): string {
    //const refEntryTemplate = await this.loader.loadTemplate("REF_ENTRY.template.ts");
    //const classRefsTemplate = await this.loader.loadTemplate("CLASS_REFS.template.ts");

    let REFS_list: string[] = []
    for (const refEntry of classDef.references) {
      REFS_list.push(
        this.buildRefEntry(refEntry, refEntryTemplate, classDef.name)
      )
    }
    const REFS = REFS_list.join(",\n")
    return this.replacer.applyPlaceholders(
      classRefsTemplate,
      {
        className: classDef.name,
        REFS: REFS,
      })
  }

  private buildRefEntry(ref: EReferenceJson, refEntryTemplate: string, className: string): string {
    //const refEntryTemplate = await this.loader.loadTemplate("REF_ENTRY.template.ts");
    //needs inlining since empty last lines cause strange look
    return this.replacer.applyPlaceholders(
      '  %%refName%%: {\n' +
      '  %%CONTENT%%\n' +
      '  } satisfies ReferenceMeta',
      {
        refName: ref.name,
        CONTENT: this.buildCONTENT(ref, className)
      })
  }

  //indented
  private buildCONTENT(ref: EReferenceJson, className: string): string {
    const lines: string[] = [];
    lines.push(`\t\ttarget: "${ref.type.replace(/^ecore:/, "")}"`);
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
    if(ref.derived) {
      lines.push(`derivingMethod: Symbol(${className}.${ref.name}.compute)`);
    }
    return lines.join(",\n\t\t"); //hence first entry needs extra indentation
  }

  private async buildModelMeta(model: EPackageJson, CLASS_REFS: string): Promise<string> {
    const modelMetaTemplate = await this.loader.loadTemplate(this.srcFolder+"model-meta.ts.template.ts");

    const classEntries = model.eClasses
      .map(cls => `    ${cls.name}: { references: ${cls.name}Refs },`)
      .join("\n");

    return this.replacer.applyPlaceholders(modelMetaTemplate, {
      ModelName: model.name,
      prefix: model.nsPrefix,
      uri: model.nsURI,
      CLASS_ENTRIES: classEntries,
      CLASS_REFS: CLASS_REFS,
      ENUMS: this.buildEnums(model)
    });
  }

}

