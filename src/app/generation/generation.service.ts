import { Injectable } from '@angular/core';
import { GenerationParams } from './generation-params';
import { ProjectGenerationService } from './project/project-generation.service';
import {ModelGenerationService} from './model/model-generation.service';
import {EClassJson, EPackageJson} from '../parsing/ecore-json';
import {RootChoosingService} from './root-choosing/root-choosing.service';
import {EditGenerationService} from './edit/edit-generation.service';
import {EditorGenerationService} from './editor/editor-generation.service';

@Injectable({ providedIn: 'root' })
export class GenerationService {

  constructor(
    private projectGen: ProjectGenerationService,
    private modelGenerationService: ModelGenerationService,
    private rootChoosingService: RootChoosingService,
    private editGenerationService: EditGenerationService,
    private editorGenerationService: EditorGenerationService,
  ) {}

  async processEcoreFile(models: EPackageJson[], projectName?: string, modelName?: string, rootByUser?: string, packageByUser?: string): Promise<string> {
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
    const root = await this.rootChoosingService.chooseRoot(models, packageByUser, rootByUser);
    const realClasses = this.filterRealClasses(models);

    await this.editGenerationService.generateServices(root, realClasses, params)
    await this.editorGenerationService.generateEditorFiles(root, realClasses, params)
    return params.projectName
  }

  private createParams(projectName?: string,  modelName?: string) : GenerationParams {
    //todo sanitize
    const finalModelName = modelName ?? 'MyModel'
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

  private filterRealClasses(models: EPackageJson[]): EClassJson[] {
    return models.flatMap(model =>
      model.eClasses.filter(c =>
        !c.abstract && !c.interfaceLike)
    )//todo verify that interfacelike does not require abstract
  }

}
