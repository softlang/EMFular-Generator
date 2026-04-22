import { Injectable } from '@angular/core';
import { GenerationParams } from './generation-params';
import { ProjectGenerationService } from './model-agnostic/project-generation.service';
import {ModelGenerationService} from './model-specific/model-generation.service';
import {Package} from '../generation-model/package';
import {ClassifierReference} from '../generation-model/cross-references';

@Injectable({ providedIn: 'root' })
export class GenerationService {

  constructor(
    private projectGen: ProjectGenerationService,
    private modelGenerationService: ModelGenerationService,
  ) {}


  async generate(pkgs: Package[], params: GenerationParams, root: ClassifierReference): Promise<void> {
    // Generate the Angular model-agnostic structure
    await this.projectGen.generateProjectFiles(params);
    await this.modelGenerationService.generateWholeModelFolder(params.modelName, pkgs, root)
  }

}
