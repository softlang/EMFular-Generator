import { Injectable } from '@angular/core';
import {MetaGenerationService} from './meta-generation.service';
import {InterfaceGenerationService} from './interface-generation.service';
import {ClassGenerationService} from './class-generation.service';
import {ModelServiceGenerationService} from './model-service-generation.service';
import {EditorGenerationService} from './editor-generation.service';
import {Package} from '../../generation-model/package';
import {ClassifierReference} from '../../generation-model/cross-references';

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

  async generateWholeModelFolder(modelName: string, model: Package[], root: ClassifierReference) {
    for(const pkg of model) {
      await this.generatePackage(pkg, modelName)
    }
    const creatableClasses: ClassifierReference[] = [] //todo
    await this.modelServiceGenerationService.generateServices(modelName, root, creatableClasses)
    await this.editorGenerationService.generateEditorFiles(modelName, root, creatableClasses)
  }

  async generatePackage(pkg: Package, modelName: string) {
    await this.metaGenerationService.generateMeta(pkg, modelName);
    await this.interfaceGenerationService.generateInterfaces(pkg);
    await this.classGenerationService.generateClasses(pkg, modelName)
  }

}
