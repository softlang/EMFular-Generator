import { Injectable } from '@angular/core';
import { EClassJson, EPackageJson } from '../../parsing/ecore-json';
import { TemplateLoadService } from '../../utils/template-load.service';
import { PlaceholderReplacerService } from '../../utils/place-holder-replacer.service';
import { ZipService } from '../../utils/zip.service';

@Injectable({
  providedIn: 'root',
})
export class ClassGenerationService {

  private srcFolder = 'assets/templates/model/v10/core/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateClasses(model: EPackageJson) {
    const classTemplate = await this.loader.loadTemplate(
      this.srcFolder + 'class.ts.template.ts'
    );
    const targetFolder = `src/app/${model.name}/core/`

    const classMap = new Map(model.eClasses.map(c => [c.name, c]));

    for (const cls of model.eClasses) {
      if (cls.interfaceLike) continue; // interfaces handled on interface service

      const fileContent = this.buildClassFile(cls, classMap, model, classTemplate);
      this.zip.addFile(`${targetFolder}/${cls.name}.ts`, fileContent);
    }
  }

  private buildClassFile(
    cls: EClassJson,
    classMap: Map<string, EClassJson>,
    model: EPackageJson,
    template: string
  ): string {

    //distinguish interfaces and real classes on super:
    const [interfaces, realClasses] = cls.resolvedSuperTypes.reduce(
      ([i, r], name) => {
        const sup = classMap.get(name)!;
        if (sup.interfaceLike) i.push(name);
        else r.push(name);
        return [i, r];
      },
      [[], []] as [string[], string[]]
    );


    // implements:
    const IMPLEMENTS = interfaces.length > 0
      ? `implements ${interfaces.join(', ')}`
      : '';

    // real parent (extends)
    const realParent = realClasses[0] ?? null;
    const EXTENDS = realParent ?? 'Referencable<any>';

    const IMPORTS = this.buildImports(cls, interfaces, realParent, model);

    const ATTRIBUTES = this.buildAttributes(cls);
    const REFERENCES = this.buildReferences(cls);

    return this.replacer.applyPlaceholders(template, {
      IMPORTS,
      modelMeta: `${model.name}Meta`,
      className: cls.name,
      EXTENDS,
      IMPLEMENTS,
      ATTRIBUTES,
      REFERENCES,
    });
  }

  private buildImports(cls: EClassJson, interfaces: string[], realParent: string|null, model: EPackageJson): string {
    const imports = new Set<string>();

    // interface supertypes (type-only)
    interfaces.forEach(i =>
      imports.add(`import type { ${i} } from './${i}';`)
    );

    // referenced types (type-only), but skip real parent and self
    cls.references.forEach(ref => {
      if (ref.type === realParent) return;
      if (ref.type === cls.name) return;
      imports.add(`import type { ${ref.type} } from './${ref.type}';`);
    });

    //modelList if needed (type-only)
    if (cls.references.some(r => r.upperBound !== 1)) {
      imports.add(`import type { ModelList } from 'emfular';`);
    }

    // meta:
    imports.add(`import { ${model.name}Meta, ${cls.name}Refs } from './_meta_';`)

    if (realParent) {
      imports.add(`import { ${realParent} } from './${realParent}';`);
    } else {
      imports.add(`import { Referencable } from 'emfular';`);
    }

    return Array.from(imports).join('\n');
  }

  private buildTypeImports(cls: EClassJson, interfaces: string[]): string {
    const imports = new Set<string>();

    // interface supertypes
    interfaces.forEach(i => imports.add(`import type { ${i} } from './${i}';`));

    // referenced types
    cls.references.forEach(ref => {
      imports.add(`import type { ${ref.type} } from './${ref.type}';`);
    });

    // ModelList if needed
    if (cls.references.some(r => r.upperBound !== 1)) {
      imports.add(`import type { ModelList } from 'emfular';`);
    }

    return Array.from(imports).join('\n');
  }

  private buildRealImports(cls: EClassJson, realParent: string | null, model: EPackageJson): string {
    const imports = [
      `import { ${model.name}Meta, ${cls.name}Refs } from './_meta_';`
    ];

    if (realParent) {
      imports.push(`import { ${realParent} } from './${realParent}';`);
    } else {
      imports.push(`import { Referencable } from 'emfular';`)
    }

    return imports.join('\n');
  }

  private buildAttributes(cls: EClassJson): string {
    return cls.attributes
      .map(a => `  @attribute()\n  ${a.name}: ${a.type} = ${this.defaultValue(a)};`)
      .join('\n\n');
  }

  private buildReferences(cls: EClassJson): string {
    return cls.references
      .map(ref => {
        const type = ref.upperBound === 1
          ? ref.type
          : `ModelList<${ref.type}>`;

        return `  @reference(${cls.name}Meta.references.${ref.name})\n  ${ref.name}: ${type};`;
      })
      .join('\n\n');
  }

  private defaultValue(a: any): string {
    if (a.defaultValueLiteral !== undefined) return JSON.stringify(a.defaultValueLiteral);
    if (a.type === 'string') return '""';
    if (a.type === 'number') return '0';
    if (a.type === 'boolean') return 'false';
    return 'undefined';
  }
}
