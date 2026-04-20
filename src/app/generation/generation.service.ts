import { Injectable } from '@angular/core';
import { GenerationParams } from './generation-params';
import { ProjectGenerationService } from './project/project-generation.service';
import {ModelGenerationService} from './model/model-generation.service';
import {EcoreParserService} from '../parsing/ecore-parser.service';
import { EPackageJson } from '../parsing/ecore-model/package';
import {RootFindingService} from './root/root-finding.service';
import {Package} from '../synthesis-model/package';
import {ClassifierReference} from '../synthesis-model/cross-references';
import {SynthesisModelService} from '../parsing/resolving/synthesis-model.service';

@Injectable({ providedIn: 'root' })
export class GenerationService {

  constructor(
    private projectGen: ProjectGenerationService,
    private modelGenerationService: ModelGenerationService,
    private ecoreParserService: EcoreParserService,
    private synthesisModelService: SynthesisModelService,
    private rootFindingService: RootFindingService,
  ) {}

  //todo now use packageByUser spot for model name
  async processEcoreFile(file: File, projectName?: string, rootByUser?: ClassifierReference, modelByUser?: string): Promise<string> {
    const xml = await this.readFile(file);
    const rawPkgs: EPackageJson[] = this.ecoreParserService.parse(xml)

    //now choose root here, it can be from any package -
    const root: ClassifierReference = await this.rootFindingService.determineRoot(rawPkgs, rootByUser)
    const params: GenerationParams = this.composeGenerationParams(file, projectName, modelByUser)
    const generationModel = this.synthesisModelService.ecoreJson2synthesisModel(rawPkgs)  //or use root here?

    await this.processPackages(generationModel, params, root);
    return params.projectName
  }

  private async processPackages(pkgs: Package[], params: GenerationParams, root: ClassifierReference): Promise<void> {
    // Generate the Angular project structure
    await this.projectGen.generateProjectFiles(params);
    await this.modelGenerationService.generateWholeModelFolder(params.modelName, pkgs, root)
  }

  private fileName(file: File): string {
    return file.name.replace(/\.[^/.]+$/, "");
  }

  private composeGenerationParams(file: File, projectName?: string, modelByUser?: string): GenerationParams {
    //use the filename as default for project and model, in case user specified nothing:
    const modelName = modelByUser ?? this.fileName(file);
    const pascalizedModel = modelName
    return {
      projectName : projectName ? projectName : pascalizedModel +"-graphical-editor",
      modelName : pascalizedModel,
      modelFileName: modelName, //for folders
      emfularVersion: '10.1.0',
    };
  }

  /*
  private classFromReferences(packages: Package[], rootByUser: ClassifierReference): EClass {
    let paths = rootByUser.path
    let pkgs = packages
    let pkg: Package|undefined;
    while (paths.length > 0) {
      let nextSegment = paths.pop()
      pkg = pkgs.find(p => p.name === nextSegment)
      if(pkg == null) {
        throw new Error("path to root not resolvable")
      } else {
        pkgs = pkg.subpackages
      }
    }
    const res = pkg?.classes.find(c => c.name===rootByUser.name)
    if(!res) {
      throw new Error(`No class with the right name ${rootByUser.name} found on path ${rootByUser.path}`)
    } else {
      return res;
    }
  }*/

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));

      reader.readAsText(file);
    });
  }

}
