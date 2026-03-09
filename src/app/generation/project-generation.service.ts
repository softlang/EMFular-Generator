import { Injectable } from '@angular/core';
import {SingleFileGeneratorService} from '../utils/single-file-generator.service';
import {FolderMapping} from './folder-mapping';

@Injectable({ providedIn: 'root' })
export class ProjectGenerationService {

  constructor(
    private single: SingleFileGeneratorService
  ) {}

  async generateFromFolderMapping(
    mapping: FolderMapping[],
    params: Record<string, string>
  ): Promise<void> {

    for (const { srcFolder, targetFolder } of mapping) {
      const fileNames = await this.scanFolder(srcFolder);

      for (const fileName of fileNames) {

        await this.single.processFile(
          srcFolder,
          fileName,
          targetFolder,
          params,
        );
      }
    }
  }

  private async scanFolder(folder: string): Promise<string[]> {
    const response = await fetch(`src/templates/${folder}/manifest.json`);
    return response.json();
  }
}
