import { Injectable } from '@angular/core';
import {TemplateLoadService} from './template-load.service';
import {PlaceholderReplacerService} from './place-holder-replacer.service';
import {ZipService} from './zip.service';


@Injectable(
  { providedIn: 'root' }
)
export class SingleFileGeneratorService {

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async processFile(
    filePath: string,
    params: Record<string, string>
  ): Promise<void> {
    const content = await this.loader.loadTemplate(filePath);

    const templateIndex = filePath.indexOf('.template.');
    const isTemplate = templateIndex !== -1;

    const outputPath = isTemplate
      ? filePath.substring(0, templateIndex)
      : filePath;

    const processed = isTemplate
      ? this.replacer.applyPlaceholders(content, params)
      : content;

    this.zip.addFile(outputPath, processed);
  }
}
