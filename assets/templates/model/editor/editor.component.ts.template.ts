import {Component} from '@angular/core';
import {
  TreeModelDetailsService,
  EditButtonDef,
  ModelEditingBarComponent,
  BasicEditorComponent,
  ReferencableBoxComponent
} from "ngx-emfular-integration";
import { BoundingBox } from 'ngx-svg-graphics';
import { Referencable} from "emfular";

import { %%modelName%%Service } from "../edit/%%modelName%%.service";
import { %%root%% } from "../core/%%root%%";

@Component({
  selector: '%%modelName%%-editor',
  imports: [
    ModelEditingBarComponent,
    BasicEditorComponent,
    ReferencableBoxComponent
  ],
  templateUrl: './%%modelName%%-editor.component.html',
  styleUrl: './%%modelName%%-editor.component.css'
})
export class %%modelName%%EditorComponent{

  svgwidth = 1500;
  svgheigth = 1000;
  initialBBox : BoundingBox = {x: this.svgwidth/2, y: 20, w: 200, h: 25}
  sidebarButtons: Array<EditButtonDef> | null = null;

  constructor(
    public treeDetailsService: TreeModelDetailsService<%%root%%>,
    public modelService: %%modelName%%Service,
  ) {
    this.sidebarButtons = [
      %%BUTTONS%%
    ]
  }

  choose(element: Referencable<any>) {
    this.treeDetailsService.openDetails(element, this.modelService)
  }

}
