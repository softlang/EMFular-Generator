import { Injectable } from '@angular/core';
import {MetaGenerationService} from './meta-generation.service';
import {InterfaceGenerationService} from './interface-generation.service';
import {ClassGenerationService} from './class-generation.service';
import {ModelServiceGenerationService} from './model-service-generation.service';
import {EditorGenerationService} from './editor-generation.service';
import {Package} from '../../synthesis-model/package';
import {EClass} from '../../synthesis-model/classifier';

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

  async generateWholeModelFolder(model: Package[], root: EClass) {
    for(const pkg of model) {
      await this.generatePackage(pkg)
    }
    const creatableClasses: string[] = [] //todo
    await this.modelServiceGenerationService.generateServices(model, root, creatableClasses)
    await this.editorGenerationService.generateEditorFiles(model, root, creatableClasses)
  }

  async generatePackage(pkg: Package) {
    await this.metaGenerationService.generateMeta(pkg);
    await this.interfaceGenerationService.generateInterfaces(pkg);
    await this.classGenerationService.generateClasses(pkg)
  }

}
