import { Injectable } from '@angular/core';
import {TemplateLoadService} from '../../utils/template-load.service';
import {PlaceholderReplacerService} from '../../utils/place-holder-replacer.service';
import {ZipService} from '../../utils/zip.service';
import {EPackageJson} from '../../parsing/ecore-json';

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

  async generateServices(model: EPackageJson) {
    const outputFolder = `src/app/${model.name}/edit/`

    const historyTemplate = await this.loader.loadTemplate(this.srcFolder+'model-history.service.ts.template.ts')
    this.zip.addFile(
      outputFolder+`${model.name}-history.service.ts`,
      this.createHistoryService(historyTemplate, model)
    )

    const modelServiceTemplate = await this.loader.loadTemplate(this.srcFolder+'model.service.ts.template.ts')
    this.zip.addFile(
      outputFolder+`${model.name}.service.ts`,
      this.createModelService(modelServiceTemplate, model)
    )
  }

  createModelService(modelServiceTemplate: string, model: EPackageJson): string {

    return this.replacer.applyPlaceholders(
      modelServiceTemplate,
      {}
    )
  }

  createHistoryService(historyTemplate: string, model: EPackageJson): string {
    return this.replacer.applyPlaceholders(
      historyTemplate,
      {
        modelName: model.name,
        root: model.root!.name
      }
    )
  }

}
