import { Injectable } from '@angular/core';
import {EClassJson} from '../../parsing/ecore-json';
import {TemplateLoadService} from '../utils/template-load.service';
import {PlaceholderReplacerService} from '../utils/place-holder-replacer.service';
import {ZipService} from '../utils/zip.service';
import {GenerationParams} from '../generation-params';
import {GenerationPaths} from '../generation-paths';
import {ImportPathCreator} from '../utils/import-path-creator';

@Injectable({
  providedIn: 'root',
})
export class EditorGenerationService {

  private srcFolder = 'assets/templates/editor/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateEditorFiles(root: EClassJson, realClasses: EClassJson[], params: GenerationParams) {
    const outputComponent = `${GenerationPaths.editorPath}/${params.modelName}-editor.component`

    //empty css
    this.zip.addFile(
      outputComponent+`.css`,
      ""//empty but existing styles
    )

    //unchanged html
    const htmlFile = await this.loader.loadTemplate(this.srcFolder+'editor.component.html');
    this.zip.addFile(
      outputComponent+`.html`,
      htmlFile
    )

    //real work: the component ts:
    const componentTsTemplate = await this.loader.loadTemplate(this.srcFolder+'editor.component.ts.template.ts');
    this.zip.addFile(
      outputComponent+`.ts`,
      this.createComponent(componentTsTemplate, root, realClasses, params)
    )
  }

  private createComponent(componentTemplate: string, root: EClassJson, realClasses: EClassJson[], params: GenerationParams): string {
    return this.replacer.applyPlaceholders(
      componentTemplate,
      {
        modelName: params.modelName,
        root: root.name,
        ROOT_IMPORT: ImportPathCreator.createImport(ImportPathCreator.cls2pkgRef(root)),
        BUTTONS: this.createButtons(realClasses)
      }
    )
  }

  createButtons(classes: EClassJson[]): string {
    return classes.map(cls => this.createButton(cls.name))
      .join(',\n');
  }

  createButton(clsName: string): string {
    const buttonTemplate = `{
        label: "%%cls%%",
        action: () => {
          const res = this.modelService.create%%cls%%()
          if(res){
            this.treeDetailsService.openDetails(res, this.modelService)
          }
        }
      }`
    return this.replacer.applyPlaceholders(
      buttonTemplate,
      {cls: clsName}
    )
  }
}
