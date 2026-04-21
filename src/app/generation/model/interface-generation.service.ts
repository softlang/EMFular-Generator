import { Injectable } from '@angular/core';
import { TemplateLoadService } from '../../utils/template-load.service';
import { PlaceholderReplacerService } from '../../utils/place-holder-replacer.service';
import { ZipService } from '../../utils/zip.service';
import {Package} from '../../synthesis-model/package';
import {EClass} from '../../synthesis-model/classifier';

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

  async generateInterfaces(model: Package) {
    const interfaceTemplate = await this.loader.loadTemplate(this.srcFolder + 'interface.ts.template.ts');
    const targetFolder = `@core/`+ model.path.join("/")

    for (const cls of model.classes) {
      if (!cls.interfaceLike) continue;
      const fileContent = this.buildInterfaceFile(cls, interfaceTemplate);
      this.zip.addFile(`${targetFolder}/${cls.name}.ts`, fileContent);
    }
  }

  private buildInterfaceFile(
    cls: EClass,
    interfaceTemplate: string
  ): string {
    const superTypes = cls.superTypes.realParent !== undefined
      ? [cls.superTypes.realParent, ...cls.superTypes.interfaces]
      : [...cls.superTypes.interfaces];


    const typeImports = superTypes.length > 0
      ? superTypes
        .map(ref => `import type { ${ref.name} } from './${ref.path.join("/")}';`)
        .join('\n')
      : '';

    const extendsClause = superTypes.length > 0
      ? `extends ${superTypes.map(c => c.name).join(', ')}`
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

