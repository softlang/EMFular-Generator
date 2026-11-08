import { Injectable } from '@angular/core';
import {ModelServiceGenerationService} from './model-service-generation.service';
import {EditorGenerationService} from './editor-generation.service';
import {EClassJson, EPackageJson} from '../../parsing/ecore-json';

@Injectable({
  providedIn: 'root',
})
export class RootDependentGenerationService {

  constructor(
    private modelServiceGenerationService: ModelServiceGenerationService,
    private editorGenerationService: EditorGenerationService
  ) {}

  async generateRootDependentFiles(model: EPackageJson, root: EClassJson) {
    const realClasses = this.filterRealClasses(model);

    await this.modelServiceGenerationService.generateServices(model, root, realClasses)
    await this.editorGenerationService.generateEditorFiles(model, root, realClasses)
  }

  private filterRealClasses(model: EPackageJson): string[] {
    return model.eClasses.filter(c => !c.abstract && !c.interfaceLike)//todo verify that inetrfacelike does not require abstract
      .map(c => c.name)
  }

}
