import {Component} from '@angular/core';
import {
  ActionButtonDef,
  BasicEditorComponent,
  GraphicalTreeDetailsService,
  ModelSpecificPaletteComponent,
  TreeModelElementComponent
} from "ngx-emfular-integration";
import { BoundingBox } from "ngx-emfular-diagram";
import { Referencable} from "emfular-core";

import { %%modelName%%Service } from "../edit/%%modelName%%.service";
import { %%root%% } from "../core/%%root%%";

@Component({
  selector: '%%modelName%%-editor',
  imports: [
    ModelSpecificPaletteComponent,
    BasicEditorComponent,
    TreeModelElementComponent
  ],
  templateUrl: './%%modelName%%-editor.component.html',
  styleUrl: './%%modelName%%-editor.component.css'
})
export class %%modelName%%EditorComponent{

  svgwidth = 1500;
  svgheigth = 500;
  initialBBox : BoundingBox = {x: this.svgwidth/2-100, y: 20, w: 200, h: 50}
  sidebarButtons: ActionButtonDef[] = [];

  constructor(
    public treeDetailsService: GraphicalTreeDetailsService<%%root%%>,
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
