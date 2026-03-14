import { Injectable } from '@angular/core';
import { GenerationParams } from './generation-params';
import { ProjectGenerationService } from './project/project-generation.service';
import {ModelGenerationService} from './model/model-generation.service';
import {Ecore2JsonService} from '../parsing/ecore2json.service';
import {EPackageJson} from '../parsing/ecore-json';
import {RootFindingService} from './root/root-finding.service';

@Injectable({ providedIn: 'root' })
export class GenerationService {

  constructor(
    private projectGen: ProjectGenerationService,
    private modelGenerationService: ModelGenerationService,
    private ecore2jsonService: Ecore2JsonService,
    private rootFindingService: RootFindingService,
  ) {}

  async processEcoreFile(file: File, projectName?: string): Promise<string> {
    const xml = await this.readFile(file);
    const model: EPackageJson = this.ecore2jsonService.parse(xml)
    const rootCandidates = this.rootFindingService.findRootEClassCandidates(model)

    const params: GenerationParams = {
      projectName : projectName ? projectName : model.name+"-graphical-editor",
      modelName : model.pascalizedName,
      modelFileName: model.name, //for folders
      emfularVersion: '10.0.0',
    };

    // Generate the Angular project structure
    await this.projectGen.generateProjectFiles(params);
    await this.modelGenerationService.generateModelFiles(model)
    return params.projectName
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));

      reader.readAsText(file);
    });
  }

}
