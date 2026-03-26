import { Injectable } from '@angular/core';
import { EClassJson, EPackageJson } from '../../parsing/ecore-json';
import { TemplateLoadService } from '../../utils/template-load.service';
import { PlaceholderReplacerService } from '../../utils/place-holder-replacer.service';
import { ZipService } from '../../utils/zip.service';

@Injectable({
  providedIn: 'root',
})
export class InterfaceGenerationService {

  private srcFolder = 'assets/templates/model/v10/core/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateInterfaces(model: EPackageJson) {
    const interfaceTemplate = await this.loader.loadTemplate(this.srcFolder + 'interface.ts.template.ts');
    const targetFolder = `src/app/${model.name}/core/`

    for (const cls of model.eClasses) {
      if (!cls.interfaceLike) continue;
      const fileContent = this.buildInterfaceFile(cls, interfaceTemplate);
      this.zip.addFile(`${targetFolder}/${cls.name}.ts`, fileContent);
    }
  }

  private buildInterfaceFile(
    cls: EClassJson,
    interfaceTemplate: string
  ): string {

    const superInterfaces = cls.resolvedSuperTypes
    const typeImports = superInterfaces.length > 0
      ? superInterfaces
        .map(name => `import type { ${name} } from './${name}';`)
        .join('\n')
      : '';

    const extendsClause = superInterfaces.length > 0
      ? `extends ${superInterfaces.join(', ')}`
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

