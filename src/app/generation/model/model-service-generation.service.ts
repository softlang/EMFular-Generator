import { Injectable } from '@angular/core';
import {TemplateLoadService} from '../../utils/template-load.service';
import {PlaceholderReplacerService} from '../../utils/place-holder-replacer.service';
import {ZipService} from '../../utils/zip.service';
import {ClassifierReference} from '../../synthesis-model/cross-references';

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

  async generateServices(modelName: string, root: ClassifierReference, realClasses: ClassifierReference[]) {
    const outputFolder = `src/app/${modelName}/edit/`

    const historyTemplate = await this.loader.loadTemplate(this.srcFolder+'model-history.service.ts.template.ts')
    this.zip.addFile(
      outputFolder+`${modelName}-history.service.ts`,
      this.createHistoryService(historyTemplate, modelName, root)
    )

    const modelServiceTemplate = await this.loader.loadTemplate(this.srcFolder+'model.service.ts.template.ts')
    this.zip.addFile(
      outputFolder+`${modelName}.service.ts`,
      this.createModelService(modelServiceTemplate, modelName, root, realClasses)
    )
  }

  createModelService(modelServiceTemplate: string, modelName: string, root: ClassifierReference, realClasses: ClassifierReference[]): string {
    const classesToInstantiate = realClasses

    return this.replacer.applyPlaceholders(
      modelServiceTemplate,
      {
        modelName: modelName,
        root: root.name,
        ALL_REAL_CLASSES_IMPORTS: this.createImports(classesToInstantiate),
        MODEL_CREATION_METHODS: this.addCreationMethods(classesToInstantiate),
      }
    )
  }

  private createImports(classes: ClassifierReference[]): string {
    return classes.map(cls => `import { ${cls.name} } from "../core/${cls.path.join("/")}";`)
      .join('\n');
  }

  private addCreationMethods(classes: ClassifierReference[]): string {
    return "\t"+classes.map(cls => `create${cls.name} () {\n\t\treturn new ${cls.name}()\n\t}\n`)
      .join('\n\t');
  }

  createHistoryService(historyTemplate: string, modelName: string, root: ClassifierReference): string {
    return this.replacer.applyPlaceholders(
      historyTemplate,
      {
        modelName: modelName,
        root: root.name,
        rootPath: root.path.join('/'),
      }
    )
  }

}
