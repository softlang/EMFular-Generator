import { Injectable } from '@angular/core';
import {ClassifierReference} from './generation-model/cross-references';
import {GenerationParams} from './generation/generation-params';
import {EPackageJson} from './parsing-model/package';
import {GenerationService} from './generation/generation.service';
import {EcoreParserService} from './parsing/ecore-parser.service';
import {Parsing2GenerationService} from './parsing2generation/parsing2generation.service';
import {RootFindingService} from './parsing2generation/root/root-finding.service';
import {ZipService} from './generation/utils/zip.service';

@Injectable({
  providedIn: 'root',
})
export class GeneratorService {

  constructor(
    private ecoreParserService: EcoreParserService,
    private parsing2GenerationService: Parsing2GenerationService,
    private rootFindingService: RootFindingService,
    private generationService: GenerationService,
    private zipService: ZipService,
  ) {
  }

  //todo now use packageByUser spot for model-specific name
  async processEcoreFile(file: File, projectName?: string, rootByUser?: ClassifierReference, modelByUser?: string): Promise<void> {
    //1) parsing:
    const xml = await this.readFile(file);
    const rawPkgs: EPackageJson[] = this.ecoreParserService.parse(xml)

    // 2) synthesis:
    //now choose root here, it can be from any package -
    const root: ClassifierReference = await this.rootFindingService.determineRoot(rawPkgs, rootByUser)
    const params: GenerationParams = this.composeGenerationParams(file, projectName, modelByUser)
    const generationModel = this.parsing2GenerationService.transform(rawPkgs)  //or use root here?

    // 3) generation:
    await this.generationService.generate(generationModel, params, root);

    // 4) download:
    await this.zipService.downloadZip(params.projectName);
  }


  private composeGenerationParams(file: File, projectName?: string, modelByUser?: string): GenerationParams {
    //use the filename as default for model-agnostic and model-specific, in case user specified nothing:
    const modelName = modelByUser ?? this.fileName(file);
    const pascalizedModel = modelName
    return {
      projectName : projectName ? projectName : pascalizedModel +"-graphical-editor",
      modelName : pascalizedModel,
      modelFileName: modelName, //for folders
      emfularVersion: '10.1.0',
    };
  }

  private fileName(file: File): string {
    return file.name.replace(/\.[^/.]+$/, "");
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
