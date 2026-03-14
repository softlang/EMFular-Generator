import { Injectable } from '@angular/core';
import {TemplateLoadService} from '../../utils/template-load.service';
import {PlaceholderReplacerService} from '../../utils/place-holder-replacer.service';
import {ZipService} from '../../utils/zip.service';
import {EClassJson, EPackageJson} from '../../parsing/ecore-json';

@Injectable({
  providedIn: 'root',
})
export class ModelServiceGenerationService {

  private srcFolder = 'assets/templates/model/services/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateServices(model: EPackageJson, root: EClassJson, realClasses: string[]) {
    const outputFolder = `src/app/${model.name}/edit/`

    const historyTemplate = await this.loader.loadTemplate(this.srcFolder+'model-history.service.ts.template.ts')
    this.zip.addFile(
      outputFolder+`${model.pascalizedName}-history.service.ts`,
      this.createHistoryService(historyTemplate, model, root)
    )

    const modelServiceTemplate = await this.loader.loadTemplate(this.srcFolder+'model.service.ts.template.ts')
    this.zip.addFile(
      outputFolder+`${model.pascalizedName}.service.ts`,
      this.createModelService(modelServiceTemplate, model, root, realClasses)
    )
  }

  createModelService(modelServiceTemplate: string, model: EPackageJson, root: EClassJson, realClasses: string[]): string {
    const classesToInstantiate= realClasses

    return this.replacer.applyPlaceholders(
      modelServiceTemplate,
      {
        modelName: model.pascalizedName,
        root: root.name,
        ALL_REAL_CLASSES_IMPORTS: this.createImports(classesToInstantiate),
        MODEL_CREATION_METHODS: this.addCreationMethods(classesToInstantiate),
      }
    )
  }

  private createImports(classes: string[]): string {
    return classes.map(cls => `import { ${cls} } from "../core/${cls}";`)
      .join('\n');
  }

  private initializeClasses(classes: string[]): string {
    const comment = '  // explicitly use modeling classes to avoid tree-shaking them away:\n'
    return comment+classes.map(cls => `againstExtinction${cls} = new ${cls}()`)
      .join('\n');
  }

  private addCreationMethods(classes: string[]): string {
    return "\t"+classes.map(cls => `create${cls} () {\n\t\treturn new ${cls}()\n\t}\n`)
      .join('\n\t');
  }

  createHistoryService(historyTemplate: string, model: EPackageJson, root: EClassJson): string {
    return this.replacer.applyPlaceholders(
      historyTemplate,
      {
        modelName: model.pascalizedName,
        root: root.name
      }
    )
  }

}
