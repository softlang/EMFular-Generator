import { Injectable } from '@angular/core';
import { GenerationParams } from './generation-params';
import { ProjectGenerationService } from './project/project-generation.service';
import {ModelGenerationService} from './model/model-generation.service';
import {Ecore2JsonService} from '../parsing/ecore2json.service';
import {EPackageJson} from '../parsing/ecore-json';

@Injectable({ providedIn: 'root' })
export class GenerationService {

  constructor(
    private projectGen: ProjectGenerationService,
    private modelGenerationService: ModelGenerationService,
    private ecore2jsonService: Ecore2JsonService,
  ) {}

  async processEcoreFile(file: File, projectName?: string): Promise<string> {
    const xml = await this.readFile(file);
    const dom = this.parseXml(xml);

    const modelName = this.extractRootEClass(dom);
    if (!modelName) {
      throw new Error('The uploaded file is not a valid Ecore model: No root EClass found.');
    }

    const modelFileName = this.toFileName(modelName);

    const params: GenerationParams = {
      projectName : projectName ? projectName : modelName+"-graphical-editor",
      modelName,
      modelFileName,
      emfularVersion: '10.0.0',
    };

    // Generate the Angular project structure
    await this.projectGen.generateProjectFiles(params);
    //todo repair service file names or accept them;
    // maybe move to further generation?

    const parsedModel: EPackageJson = this.ecore2jsonService.parse(xml)
    await this.modelGenerationService.generateModelFiles(parsedModel)
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

  private parseXml(xml: string): Document {
    const parser = new DOMParser();
    const dom = parser.parseFromString(xml, 'application/xml');

    const error = dom.querySelector('parsererror');
    if (error) {
      throw new Error('The uploaded file is not valid XML.');
    }

    return dom;
  }

  private extractRootEClass(dom: Document): string | null {
    const classifiers = Array.from(dom.getElementsByTagName('eClassifiers'));

    const firstEClass = classifiers.find(el =>
      el.getAttribute('xsi:type') === 'ecore:EClass'
    );

    return firstEClass?.getAttribute('name') ?? null;
  }

  private toFileName(name: string): string {
    return name.charAt(0).toLowerCase() + name.slice(1);
  }
}
