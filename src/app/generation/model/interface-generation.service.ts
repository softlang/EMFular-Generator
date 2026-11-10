import { Injectable } from '@angular/core';
import {ClassifierRef, EClassJson, EPackageJson} from '../../parsing/ecore-json';
import { TemplateLoadService } from '../utils/template-load.service';
import { PlaceholderReplacerService } from '../utils/place-holder-replacer.service';
import { ZipService } from '../utils/zip.service';
import {GenerationPaths} from '../generation-paths';
import {ImportPathCreator} from "../utils/import-path-creator";

@Injectable({
  providedIn: 'root',
})
export class InterfaceGenerationService {

  private srcFolder = 'assets/templates/model/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateInterfaces(model: EPackageJson) {
    const interfaceTemplate = await this.loader.loadTemplate(this.srcFolder + 'interface.ts.template.ts');

    for (const cls of model.eClasses) {
      if (!cls.interfaceLike) continue;
      const fileContent = this.buildInterfaceFile(cls, interfaceTemplate);
      this.zip.addFile(`${GenerationPaths.modelPath}/${model.name}/${cls.name}.ts`, fileContent);
    }
  }

  private buildInterfaceFile(
    cls: EClassJson,
    interfaceTemplate: string
  ): string {
    const ownPackageRef: ClassifierRef = ImportPathCreator.cls2pkgRef(cls)
    const typeImports = cls.superTypes.length > 0
      ? cls.superTypes
        .map(ref =>
            ImportPathCreator.createImportBetweenClassifiers(ref, ownPackageRef, true)
        )
        .join('\n')
      : '';

    const superInterfaceNames = cls.superTypes.map((r) => r.name);
    const extendsClause = superInterfaceNames.length > 0
      ? `extends ${superInterfaceNames.join(', ')}`
      : '';

    return this.replacer.applyPlaceholders(
      interfaceTemplate,
      {
        TYPE_IMPORTS: typeImports,
        className: cls.name,
        SUPER_INTERFACES: extendsClause,
      }
    );
  }

}

