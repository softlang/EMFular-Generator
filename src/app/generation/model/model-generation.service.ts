import { Injectable } from '@angular/core';
import {MetaGenerationService} from './meta-generation.service';
import {InterfaceGenerationService} from './interface-generation.service';
import {ClassGenerationService} from './class-generation.service';
import {EPackageJson} from '../../parsing/ecore-json';

@Injectable({
  providedIn: 'root',
})
export class ModelGenerationService {
  constructor(
    private metaGenerationService: MetaGenerationService,
    private interfaceGenerationService: InterfaceGenerationService,
    private classGenerationService: ClassGenerationService,
  ) {}

  async generateModelFiles(model: EPackageJson) {
    await this.metaGenerationService.generateMeta(model);
    await this.interfaceGenerationService.generateInterfaces(model);
    await this.classGenerationService.generateClasses(model)
  }
}
