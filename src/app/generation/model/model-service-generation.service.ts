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


  }

  createHistoryService(historyTemplate: string, model: EPackageJson) {
    this.replacer.applyPlaceholders(
      historyTemplate,
      {
        modelName: model.name,
        root: ""
      }
    )
  }

}
