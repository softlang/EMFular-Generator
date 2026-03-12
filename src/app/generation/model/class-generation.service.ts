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
      if (cls.interfaceLike) continue; // interfaces handled elsewhere

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

    // 1. Real parent (only one allowed)
    const realParent = this.resolveRealParent(cls, classMap);

    // 2. Interface supertypes
    const interfaces = cls.resolvedSuperTypes
      .map(n => classMap.get(n)!)
      .filter(c => c.interfaceLike)
      .map(c => c.name);

    // 3. Imports
    const TYPE_IMPORTS = this.buildTypeImports(cls, interfaces);
    const REAL_IMPORTS = this.buildRealImports(realParent, model);

    // 4. Extends + implements
    const extendsExpr = realParent ?? 'Referencable<any>';
    const implementsExpr = interfaces.length > 0
      ? `implements ${interfaces.join(', ')}`
      : '';

    // 5. Attributes + references
    const ATTRIBUTES = this.buildAttributes(cls);
    const REFERENCES = this.buildReferences(cls);

    return this.replacer.applyPlaceholders(template, {
      TYPE_IMPORTS,
      REAL_IMPORTS,
      modelMeta: `${model.name}Meta`,
      className: cls.name,
      extendsExpr,
      implementsExpr,
      ATTRIBUTES,
      REFERENCES,
    });
  }

  private resolveRealParent(cls: EClassJson, classMap: Map<string,EClassJson>): string | null {
    const parents = cls.resolvedSuperTypes
      .map(n => classMap.get(n)!)
      .filter(c => !c.interfaceLike);

    if (parents.length > 1) {
      throw new Error(`Class ${cls.name} has multiple real parents`);
    }

    return parents.length === 1 ? parents[0].name : null;
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
      imports.add(`import type { ModelList } from '../ModelList';`);
    }

    return Array.from(imports).join('\n');
  }

  private buildRealImports(realParent: string | null, model: EPackageJson): string {
    const imports = [
      `import { Referencable } from '../Referencable';`,
      `import { ${model.name}Meta } from '../_meta_';`
    ];

    if (realParent) {
      imports.push(`import { ${realParent} } from './${realParent}';`);
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
