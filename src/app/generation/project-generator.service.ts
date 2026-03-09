import { Injectable } from '@angular/core';
import {TemplateLoadService} from '../utils/template-load.service';
import {PlaceholderReplacerService} from '../utils/place-holder-replacer.service';
import {GeneratedFile} from './generated-file';


@Injectable({ providedIn: 'root' })
export class FileGeneratorService {

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService
  ) {}

  async generateFiles(
    filePaths: string[],
    params: Record<string, string>
  ): Promise<GeneratedFile[]> {
    const result: GeneratedFile[] = [];

    for (const path of filePaths) {
      const content = await this.loader.loadTemplate(path);
      const templateIndex = path.indexOf('.template.');

      const isTemplate = templateIndex !== -1;
      const outputPath = isTemplate
        ? path.substring(0, templateIndex)
        : path;

      const processed = isTemplate
        ? this.replacer.applyPlaceholders(content, params)
        : content;

      result.push({
        path: outputPath,
        content: processed
      });
    }

    return result;
  }
}
