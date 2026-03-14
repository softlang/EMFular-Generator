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

  async generateServices(model: EPackageJson, root: EClassJson) {
    const outputFolder = `src/app/${model.name}/edit/`

    const historyTemplate = await this.loader.loadTemplate(this.srcFolder+'model-history.service.ts.template.ts')
    this.zip.addFile(
      outputFolder+`${model.pascalizedName}-history.service.ts`,
      this.createHistoryService(historyTemplate, model, root)
    )

    const modelServiceTemplate = await this.loader.loadTemplate(this.srcFolder+'model.service.ts.template.ts')
    this.zip.addFile(
      outputFolder+`${model.pascalizedName}.service.ts`,
      this.createModelService(modelServiceTemplate, model, root)
    )
  }

  createModelService(modelServiceTemplate: string, model: EPackageJson, root: EClassJson): string {
    //only to work against extinction by tree shaking on model
    const classesToInstantiate= this.filterRealClasses(model)
    //todo we could also write create methods for all objects...

    return this.replacer.applyPlaceholders(
      modelServiceTemplate,
      {
        modelName: model.pascalizedName,
        root: root.name,
        ANTI_EXTINCTION_IMPORTS: this.createImports(classesToInstantiate),
        ANTI_EXTINCTION_PROPERTIES: this.initializeClasses(classesToInstantiate),
      }
    )
  }

  private filterRealClasses(model: EPackageJson): string[] {
    return model.eClasses.filter(c => !c.abstract && !c.interfaceLike)//todo verify that inetrfacelike does not require abstract
      .map(c => c.name)
  }

  private createImports(classes: string[]): string {
    return classes.map(cls => `import { ${cls} } from "../core/${cls}";`)
      .join('\n');
  }

  private initializeClasses(classes: string[]): string {
    return classes.map(cls => `againstExtinction${cls} = new ${cls}()`)
      .join('\n');
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
