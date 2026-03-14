import { Injectable } from '@angular/core';
import {MetaGenerationService} from './meta-generation.service';
import {InterfaceGenerationService} from './interface-generation.service';
import {ClassGenerationService} from './class-generation.service';
import {EClassJson, EPackageJson} from '../../parsing/ecore-json';
import {ModelServiceGenerationService} from './model-service-generation.service';
import {EditorGenerationService} from './editor-generation.service';

@Injectable({
  providedIn: 'root',
})
export class ModelGenerationService {
  constructor(
    private metaGenerationService: MetaGenerationService,
    private interfaceGenerationService: InterfaceGenerationService,
    private classGenerationService: ClassGenerationService,
    private modelServiceGenerationService: ModelServiceGenerationService,
    private editorGenerationService: EditorGenerationService,
  ) {}

  async generateModelFiles(model: EPackageJson, root: EClassJson) {
    await this.metaGenerationService.generateMeta(model);
    await this.interfaceGenerationService.generateInterfaces(model);
    await this.classGenerationService.generateClasses(model)

    const realClasses = this.filterRealClasses(model);

    await this.modelServiceGenerationService.generateServices(model, root, realClasses)
    await this.editorGenerationService.generateEditorFiles(model, root, realClasses)
  }

  private filterRealClasses(model: EPackageJson): string[] {
    return model.eClasses.filter(c => !c.abstract && !c.interfaceLike)//todo verify that inetrfacelike does not require abstract
      .map(c => c.name)
  }
}
