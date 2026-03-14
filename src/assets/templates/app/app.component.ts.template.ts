import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { %%modelName%%EditorComponent } from './%%modelFileName%%/editor/%%modelName%%-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, %%modelName%%EditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = '%%projectName%%';

  constructor() {}
}
