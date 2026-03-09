import { Injectable } from '@angular/core';
import {SingleFileGeneratorService} from '../utils/single-file-generator.service';

@Injectable({ providedIn: 'root' })
export class ProjectGenerationService {

  constructor(
    private single: SingleFileGeneratorService
  ) {}

  async generateFromFolders(
    folders: string[],
    params: Record<string, string>
  ): Promise<void> {

    for (const folder of folders) {
      const filePaths = await this.scanFolder(folder);
      for (const filePath of filePaths) {
        await this.single.processFile(filePath, params);
      }
    }
  }

  private async scanFolder(folder: string): Promise<string[]> {
    const response = await fetch(`src/templates/${folder}/manifest.json`);
    return response.json();
  }
}
