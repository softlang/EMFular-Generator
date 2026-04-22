import { Injectable } from '@angular/core';
import {SingleFileGeneratorService} from './single-file-generator.service';
import {GenerationParams} from '../generation-params';
import {PROJECT_FOLDER_MAPPINGS} from './FolderMapping';

@Injectable({ providedIn: 'root' })
export class ProjectGenerationService {

  constructor(
    private single: SingleFileGeneratorService
  ) {}

  async generateProjectFiles(params: GenerationParams): Promise<void> {

    for (const { srcFolder, targetFolder, fileNames } of PROJECT_FOLDER_MAPPINGS) {
      const resolvedTarget = this.resolvePlaceholders(targetFolder, params);

      for (const fileName of fileNames) {
        await this.single.processFile(
          srcFolder,
          fileName,
          resolvedTarget,
          params as any
        );
      }
    }
  }

  private resolvePlaceholders(path: string, params: GenerationParams): string {
    return path
      .replace(/%%modelFileName%%/g, params.modelFileName)
      .replace(/%%modelName%%/g, params.modelName)
      .replace(/%%projectName%%/g, params.projectName);
  }

}
