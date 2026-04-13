import { Injectable } from '@angular/core';
import { GenerationParams } from './generation-params';
import { ProjectGenerationService } from './project/project-generation.service';
import {ModelGenerationService} from './model/model-generation.service';
import {EcoreParserService} from '../parsing/ecore-parser.service';
import { EPackageJson } from '../parsing/ecore-model/package';
import {RootFindingService} from './root/root-finding.service';
import {RootSelectionDialogComponent} from './root/root-selection-dialog/root-selection-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {firstValueFrom} from 'rxjs';
import {EClassJson} from '../parsing/ecore-model/classifier';
import {Package} from '../synthesis-model/package';
import {EClass} from '../synthesis-model/classifier';
import {ClassifierReference} from '../synthesis-model/cross-references';

@Injectable({ providedIn: 'root' })
export class GenerationService {

  constructor(
    private projectGen: ProjectGenerationService,
    private modelGenerationService: ModelGenerationService,
    private ecoreParserService: EcoreParserService,
    private rootFindingService: RootFindingService,
    private dialog: MatDialog,
  ) {}

  //todo now use packageByUser spot for model name
  async processEcoreFile(file: File, projectName?: string, rootByUser?: ClassifierReference, modelByUser?: string): Promise<string> {
    const xml = await this.readFile(file);
    const pkgs: Package[] = this.ecoreParserService.parse2(xml)

    const params: GenerationParams = this.composeGenerationParams(file, projectName, modelByUser)
    //now choose root here, it can be from any package
    const root: EClass = await this.determineRoot2(pkgs, rootByUser)

    await this.processPackages(pkgs, params, root);
    return params.projectName
  }

  private async processPackages(pkgs: Package[], params: GenerationParams, root: EClass): Promise<void> {
    // Generate the Angular project structure
    await this.projectGen.generateProjectFiles(params);
    //todo:     await this.modelGenerationService.generateModelFiles(model, root)
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

  private async processEPackage(model: EPackageJson, projectName?: string, rootByUser?: string): Promise<string> {
    const params: GenerationParams = {
      projectName : projectName ? projectName : model.name+"-graphical-editor",
      modelName : model.pascalizedName,
      modelFileName: model.name, //for folders
      emfularVersion: '10.1.0',
    };

    // Generate the Angular project structure
    await this.projectGen.generateProjectFiles(params);

    // choose root:
    let root : EClassJson | null;
    if(rootByUser) {
      root = this.rootFromUser(model, rootByUser)
    } else {
      root = await this.determineRoot(model);
      if (root == null) {
        throw new Error(
          'Auto-detection for Root failed: No root candidate found - please choose one explicitly.'
        ); //todo we could generate all but services
      }
    }
    await this.modelGenerationService.generateModelFiles(model, root)
    return params.projectName
  }

  private async determineRoot2(pkgs: Package[], rootByUser?: ClassifierReference): Promise<EClass> {
    if(rootByUser) {
      return this.classFromReferences(pkgs, rootByUser);
    } else {
      return await this.rootByAsking(pkgs)
    }
  }

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
  }

  private async rootByAsking(pkgs: Package[]): Promise<EClass> {
    //first reduce classes on pkgs to that that are root candidates:
    const resPkgs = pkgs.map(p => this.reduceToCandidates(p))
    //then check if there is only one real candidate - if yes, use it, else ask the user.
    const candidates: EClass[] = resPkgs.flatMap(p => p.classes)
    if (candidates.length === 1) {
      return candidates[0];
    }
    if (candidates.length === 0) {
      throw new Error("No non-abstract, not interface-like class found, hence no useful generation possible")
    }
    const userRoot = await this.pickRoot2(resPkgs)
    if(!userRoot) {
      throw new Error("Please pick a root class")
    }
    return userRoot;
  }

  private async pickRoot2(pkgs: Package[]): Promise<EClass| null> {
      return null; //todo
  }

  private reduceToCandidates(pkg: Package): Package {
    const res: Package = {
      ...pkg
    }
    res.classes = this.rootFindingService.allPossibleRootClasses2(pkg)
    return res
  }

  private rootFromUser(model: EPackageJson, rootByUser: string): EClassJson {
    const root = model.eClasses.find(c => c.name === rootByUser)
    if (!root) {
      throw new Error(`Given Root class ${rootByUser} not found on Package ${model.name}.\n`
      +`Classes are ${model.eClasses.map(c => c.name).join(', ')}.`);
    }
    return root;
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));

      reader.readAsText(file);
    });
  }

  async determineRoot(model: EPackageJson): Promise<EClassJson | null> {
    const candidates = this.rootFindingService.allPossibleRootClasses(model);
    if (candidates.length === 1) {
      return candidates[0];
    }
    if (candidates.length === 0) {
      throw new Error("No non-abstract, not interface-like class found, hence no useful generation possible")
    }
    return await this.pickRoot(candidates);
  }

  async pickRoot(candidates: EClassJson[]): Promise<EClassJson | null> {
    const dialogRef = this.dialog.open(RootSelectionDialogComponent, {
      data: candidates,
    });
    return await firstValueFrom(dialogRef.afterClosed());
  }

}
