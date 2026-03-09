import { Injectable } from '@angular/core';
import { GenerationParams } from './generation-params';
import { ProjectGenerationService } from './project-generation.service';

@Injectable({ providedIn: 'root' })
export class GenerationService {

  constructor(
    private projectGen: ProjectGenerationService
  ) {}

  async processEcoreFile(file: File, projectName: string): Promise<void> {
    const xml = await this.readFile(file);
    const dom = this.parseXml(xml);

    const modelName = this.extractRootEClass(dom);
    if (!modelName) {
      throw new Error('The uploaded file is not a valid Ecore model: No root EClass found.');
    }

    const modelFileName = this.toFileName(modelName);

    const params: GenerationParams = {
      projectName,
      modelName,
      modelFileName,
      emfularVersion: '10.0.0',

      // TODO: filled later by the model generator
      allModelImports: '',
      antiExtinctionProperties: ''
    };

    // Generate the Angular project structure
    await this.projectGen.generateProjectFiles(params);

    // TODO: call ModelGenerationService once implemented
    // await this.modelGen.generateModel(params);
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
