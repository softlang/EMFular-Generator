import { Injectable } from '@angular/core';
import {TemplateLoadService} from '../../utils/template-load.service';
import {PlaceholderReplacerService} from '../../utils/place-holder-replacer.service';
import {ZipService} from '../../utils/zip.service';
import {EClassJson} from '../../parsing/ecore-json';
import {GenerationParams} from '../generation-params';
import {GenerationPaths} from '../generation-paths';

@Injectable({
  providedIn: 'root',
})
export class EditGenerationService {

  private srcFolder = 'assets/templates/model/services/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateServices(root: EClassJson, realClasses: EClassJson[], params: GenerationParams) {
    const outputFolder = `${GenerationPaths.editPath}/${params.modelName}-history.service`

    const historyTemplate = await this.loader.loadTemplate(this.srcFolder+'model-history.service.ts.template.ts')
    this.zip.addFile(
      outputFolder+`.ts`,
      this.createHistoryService(historyTemplate, root, params)
    )

    const modelServiceTemplate = await this.loader.loadTemplate(this.srcFolder+'model.service.ts.template.ts')
    this.zip.addFile(
      outputFolder+`.ts`,
      this.createModelService(modelServiceTemplate, root, params, realClasses)
    )
  }

  createModelService(modelServiceTemplate: string, root: EClassJson, params: GenerationParams, realClasses: EClassJson[]): string {
    const classesToInstantiate= realClasses

    return this.replacer.applyPlaceholders(
      modelServiceTemplate,
      {
        modelName: params.modelName,
        root: root.name,
        ALL_REAL_CLASSES_IMPORTS: this.createImports(classesToInstantiate),
        MODEL_CREATION_METHODS: this.addCreationMethods(classesToInstantiate),
      }
    )
  }

  private createImports(classes: EClassJson[]): string {
    return classes.map(cls => `import { ${cls.name} } from "../core/${cls.name}";`) //todo add paths
      .join('\n');
  }

  private addCreationMethods(classes: EClassJson[]): string {
    return "\t"+classes.map(cls => `create${cls.name} () {\n\t\treturn new ${cls.name}()\n\t}\n`)
      .join('\n\t'); //todo will we need extra import as?
  }

  createHistoryService(historyTemplate: string, root: EClassJson, params: GenerationParams): string {
    return this.replacer.applyPlaceholders(
      historyTemplate,
      {
        modelName: params.modelName,
        root: root.name
      }
    )
  }

}
