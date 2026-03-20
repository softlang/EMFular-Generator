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

@Injectable({ providedIn: 'root' })
export class GenerationService {

  constructor(
    private projectGen: ProjectGenerationService,
    private modelGenerationService: ModelGenerationService,
    private ecore2jsonService: Ecore2JsonService,
    private rootFindingService: RootFindingService,
    private dialog: MatDialog,
  ) {}

  async processEcoreFile(file: File, projectName?: string): Promise<string> {
    const xml = await this.readFile(file);
    let model: EPackageJson;
    try {
      model = this.ecore2jsonService.parse(xml);
    } catch (e) {
      console.error("PARSER ERROR:", e);
      throw e; // bubble up to component
    }
    //const model: EPackageJson = this.ecore2jsonService.parse(xml)

    const params: GenerationParams = {
      projectName : projectName ? projectName : model.name+"-graphical-editor",
      modelName : model.pascalizedName,
      modelFileName: model.name, //for folders
      emfularVersion: '10.1.0',
    };

    // Generate the Angular project structure
    await this.projectGen.generateProjectFiles(params);

    // choose root:
    const root: EClassJson | null = await this.determineRoot(model);
    if (root == null) {
      throw new Error('No root found'); //todo we could generate all but services
    }

    await this.modelGenerationService.generateModelFiles(model, root)
    return params.projectName
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
