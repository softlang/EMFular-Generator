import { Injectable } from '@angular/core';
import {ModelServiceGenerationService} from './model-service-generation.service';
import {EditorGenerationService} from './editor-generation.service';
import {EClassJson, EPackageJson} from '../../parsing/ecore-json';
import {GenerationParams} from '../generation-params';

@Injectable({
  providedIn: 'root',
})
export class RootDependentGenerationService {

  constructor(
    private modelServiceGenerationService: ModelServiceGenerationService,
    private editorGenerationService: EditorGenerationService
  ) {}

  async generateRootDependentFiles(models: EPackageJson[], root: EClassJson, params: GenerationParams) {
    const realClasses = this.filterRealClasses(models);

    await this.modelServiceGenerationService.generateServices(root, realClasses, params)
    await this.editorGenerationService.generateEditorFiles(root, realClasses, params)
  }

  private filterRealClasses(models: EPackageJson[]): EClassJson[] {
    return models.flatMap(model =>
      model.eClasses.filter(c =>
        !c.abstract && !c.interfaceLike)
    )//todo verify that inetrfacelike does not require abstract
  }

}
