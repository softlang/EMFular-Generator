import { Injectable } from '@angular/core';
import { GenerationParams } from './generation-params';
import { ProjectGenerationService } from './project/project-generation.service';
import {ModelGenerationService} from './model/model-generation.service';
import {Ecore2JsonService} from '../parsing/ecore2json.service';
import {EClassJson, EPackageJson} from '../parsing/ecore-json';
import {RootFindingService} from './root/root-finding.service';
import {RootSelectionDialogComponent} from './root/root-selection-dialog/root-selection-dialog.component';
import {MatDialog} from '@angular/material/dialog';
import {firstValueFrom} from 'rxjs';
import {PackageSelectionDialogComponent} from './package-selection-dialog/package-selection-dialog';
import {RootDependentGenerationService} from "./root-dependent/root-dependent-generation.service";

@Injectable({ providedIn: 'root' })
export class GenerationService {

  constructor(
    private projectGen: ProjectGenerationService,
    private modelGenerationService: ModelGenerationService,
    private rootDependentGenerationService: RootDependentGenerationService,
    private ecore2jsonService: Ecore2JsonService,
    private rootFindingService: RootFindingService,
    private dialog: MatDialog,
  ) {}

  async processEcoreFile(file: File, projectName?: string, modelName?: string, rootByUser?: string, packageByUser?: string): Promise<string> {
    const xml = await this.readFile(file);
    const models: EPackageJson[] = this.ecore2jsonService.parse(xml)

    const params: GenerationParams = this.createParams(projectName, modelName)
    // Generate the Angular project structure
    await this.projectGen.generateProjectFiles(params);
    // generate the core model
    await Promise.all(
        models.map((model) =>
            this.modelGenerationService.generateModelFiles(model)
        )
    );
    //generate edit and editors (requires root choice)
    const root = await this.chooseRoot(models, packageByUser, rootByUser);
    await this.rootDependentGenerationService.generateRootDependentFiles(models,root, params);
    return params.projectName
  }

  private createParams(projectName?: string,  modelName?: string) : GenerationParams {
    //todo sanitize
    const finalModelName = modelName ?? 'model'
    const pascalizedModelName = finalModelName //todo pascalize
    const trimmedName = projectName?.trim()
    let finalProjectName;
    if (trimmedName?.length && trimmedName.length >0) {
      finalProjectName = trimmedName
    } else{
      finalProjectName = finalModelName+"-graphical-editor"
    }
    return {
      projectName : finalProjectName,
      modelName : pascalizedModelName,
      modelFileName: finalModelName, //for folders
    };
  }

  async choosePackage(models: EPackageJson[], packageByUser?: string): Promise<EPackageJson> {
    if(models.length == 0){
      throw new Error('No EPackages found.');
    }
    let model: EPackageJson;
    if(packageByUser){
      let match = models.find(p => p.name == packageByUser)
      if(match){
        model = match;
      } else {
        throw new Error(
            `Given EPackage class ${packageByUser} not found.\n`
            +`Packages are ${models.map(c => c.name).join(', ')}.`
        );
      }
    } else {
      if (models.length == 1) {
        model = models[0]
      } else {  //no autodetection, just user choice
        const choice = await this.pickPackage(models);
        if (choice) {
          model = choice;
        } else {
          throw new Error(
              `Several packages found (${models.map(m => m.name)}) - please choose one explicitly.`
          );
        }
      }
    }
    return model
  }

  async pickPackage(candidates: EPackageJson[]): Promise<EPackageJson | null> {
    const dialogRef = this.dialog.open(PackageSelectionDialogComponent, {
      data: candidates,
    });
    return await firstValueFrom(dialogRef.afterClosed());
  }

  private async chooseRoot(models: EPackageJson[], packageByUser?:string, rootByUser?: string): Promise<EClassJson> {
    const pkg: EPackageJson = await this.choosePackage(models, packageByUser)
    let root : EClassJson | null;
    if(rootByUser) {
      root = this.rootFromUser(pkg, rootByUser)
    } else {
      root = await this.determineRoot(pkg);
      if (root == null) {
        throw new Error(
            'Auto-detection for Root failed: No root candidate found - please choose one explicitly.'
        ); //todo we could generate all but services
      }
    }
    return root
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
