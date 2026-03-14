import {Component} from '@angular/core';
import {
  BasicModelDetailsService,
  EditButtonDef,
  TreeEditorComponent
} from "ngx-emfular-integration";
import { %%modelName%%Service } from "../edit/%%modelName%%.service";
import { %%root%% } from "../core/%%root%%";

@Component({
  selector: '%%modelName%%-editor',
  imports: [
    TreeEditorComponent
  ],
  templateUrl: './%%modelName%%-editor.component.html',
  styleUrl: './%%modelName%%-editor.component.css'
})
export class %%modelName%%EditorComponent{

  customButtons: Array<EditButtonDef> | null = null;

  constructor(
    public basicDetailsService: BasicModelDetailsService<%%root%%>,
    public modelService: %%modelName%%Service,
  ) {
    this.customButtons = [
      %%BUTTONS%%
    ]
  }

}
