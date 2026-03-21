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

@Injectable({ providedIn: 'root' })
export class GenerationService {

  constructor(
    private projectGen: ProjectGenerationService,
    private modelGenerationService: ModelGenerationService,
    private ecore2jsonService: Ecore2JsonService,
    private rootFindingService: RootFindingService,
    private dialog: MatDialog,
  ) {}

  async processEcoreFile(file: File, projectName?: string, rootByUser?: string, packageByUser?: string): Promise<string> {
    const xml = await this.readFile(file);
    // multi package ecores
    const models: EPackageJson[] = this.ecore2jsonService.parse(xml)
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
      if(models.length ==1){
        model = models[0]
      } else {  //no autodetection, just user choice
        const choice = await this.pickPackage(models);
        if(choice){
          model = choice;
        } else {
          throw new Error(
            `Several packages found (${models.map(m => m.name)}) - please choose one explicitly.`
          );
        }
      }
    }
    return await this.processEPackage(model, projectName, rootByUser);
  }

  async pickPackage(candidates: EPackageJson[]): Promise<EPackageJson | null> {
    const dialogRef = this.dialog.open(PackageSelectionDialogComponent, {
      data: candidates,
    });
    return await firstValueFrom(dialogRef.afterClosed());
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
    const candidates = this.rootFindingService.findRootEClassCandidates(model);
    if (candidates.length === 1) {
      return candidates[0];
    }
    if (candidates.length === 0) {
      return null; // or open a manual selection dialog over all
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
