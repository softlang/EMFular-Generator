import { Injectable } from '@angular/core';
import {EClassJson, EPackageJson} from '../../parsing/ecore-json';
import {TemplateLoadService} from '../../utils/template-load.service';
import {PlaceholderReplacerService} from '../../utils/place-holder-replacer.service';
import {ZipService} from '../../utils/zip.service';

@Injectable({
  providedIn: 'root',
})
export class EditorGenerationService {

  private srcFolder = 'assets/templates/model/editor/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateEditorFiles(model: EPackageJson, root: EClassJson, realClasses: string[]) {
    const outputFolder = `src/app/${model.name}/editor/`

    //empty css
    this.zip.addFile(
      outputFolder+`${model.pascalizedName}-editor.component.css`,
      ""//empty but existing styles
    )

    //unchanged html
    const htmlFile = await this.loader.loadTemplate(this.srcFolder+'editor.component.html');
    this.zip.addFile(
      outputFolder+`${model.pascalizedName}-editor.component.html`,
      htmlFile
    )

    //real work: the component ts:
    const componentTsTemplate = await this.loader.loadTemplate(this.srcFolder+'editor.component.ts.template.ts');
    this.zip.addFile(
      outputFolder+`${model.pascalizedName}-editor.component.ts`,
      this.createComponent(componentTsTemplate, model, root, realClasses)
    )
  }

  private createComponent(componentTemplate: string, model: EPackageJson, root: EClassJson, realClasses: string[]): string {
    return this.replacer.applyPlaceholders(
      componentTemplate,
      {
        modelName: model.pascalizedName,
        root: root.name,
        BUTTONS: this.createButtons(realClasses)
      }
    )
  }

  createButtons(classes: string[]): string {
    return classes.map(cls => this.createButton(cls))
      .join(',\n');
  }

  createButton(clsName: string): string {
    const buttonTemplate = `{
        label: "%%cls%%",
        icon: "+",
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
