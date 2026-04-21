import { Injectable } from '@angular/core';
import {TemplateLoadService} from '../../utils/template-load.service';
import {PlaceholderReplacerService} from '../../utils/place-holder-replacer.service';
import {ZipService} from '../../utils/zip.service';
import {ClassifierReference} from '../../generation-model/cross-references';

@Injectable({
  providedIn: 'root',
})
export class EditorGenerationService {

  private srcFolder = 'assets/templates/model-specific/editor/';

  constructor(
    private loader: TemplateLoadService,
    private replacer: PlaceholderReplacerService,
    private zip: ZipService
  ) {}

  async generateEditorFiles(modelName: string, root: ClassifierReference, realClasses: ClassifierReference[]) {
    const outputFolder = `src/app/${modelName}/editor/`

    //empty css
    this.zip.addFile(
      outputFolder+`${modelName}-editor.component.css`,
      ""//empty but existing styles
    )

    //unchanged html
    const htmlFile = await this.loader.loadTemplate(this.srcFolder+'editor.component.html');
    this.zip.addFile(
      outputFolder+`${modelName}-editor.component.html`,
      htmlFile
    )

    //real work: the component ts:
    const componentTsTemplate = await this.loader.loadTemplate(this.srcFolder+'editor.component.ts.template.ts');
    this.zip.addFile(
      outputFolder+`${modelName}-editor.component.ts`,
      this.createComponent(componentTsTemplate, modelName, root, realClasses)
    )
  }

  private createComponent(componentTemplate: string, modelName: string, root: ClassifierReference, realClasses: ClassifierReference[]): string {
    return this.replacer.applyPlaceholders(
      componentTemplate,
      {
        modelName: modelName,
        root: root.name,
        BUTTONS: this.createButtons(realClasses.map(c => c.name))
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
