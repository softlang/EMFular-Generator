import { Injectable } from '@angular/core';
import {MetaGenerationService} from './meta-generation.service';
import {InterfaceGenerationService} from './interface-generation.service';
import {ClassGenerationService} from './class-generation.service';
import {EClassJson, EPackageJson} from '../../parsing/ecore-json';
import {ModelServiceGenerationService} from './model-service-generation.service';

@Injectable({
  providedIn: 'root',
})
export class ModelGenerationService {
  constructor(
    private metaGenerationService: MetaGenerationService,
    private interfaceGenerationService: InterfaceGenerationService,
    private classGenerationService: ClassGenerationService,
    private modelServiceGenerationService: ModelServiceGenerationService,
  ) {}

  async generateModelFiles(model: EPackageJson, root: EClassJson) {
    await this.metaGenerationService.generateMeta(model);
    await this.interfaceGenerationService.generateInterfaces(model);
    await this.classGenerationService.generateClasses(model)
    await this.modelServiceGenerationService.generateServices(model, root)
  }
}
