import { Injectable } from '@angular/core';
import {TemplateLoadService} from '../../utils/template-load.service';
import {PlaceholderReplacerService} from '../../utils/place-holder-replacer.service';
import {ZipService} from '../../utils/zip.service';


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
    srcFolder: string,
    srcFileName: string,
    targetFolder: string,
    params: Record<string, string>,
  ): Promise<void> {
    const content = await this.loader.loadTemplate(`${srcFolder}/${srcFileName}`);

    const templateIndex = srcFileName.indexOf('.template.');
    const isTemplate = templateIndex !== -1;

    const outputFileName = isTemplate
      ? srcFileName.substring(0, templateIndex)
      : srcFileName;

    const processed = isTemplate
      ? this.replacer.applyPlaceholders(content, params)
      : content;

    this.zip.addFile(`${targetFolder}/${outputFileName}`, processed);
  }

}
