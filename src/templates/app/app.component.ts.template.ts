import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TreeEditorComponent } from 'ngx-emfular-integration';
import { {{modelServiceName}} } from '{{modelServiceImportPath}}';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TreeEditorComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = '{{projectName}}';

  constructor(
    protected modelService: {{modelServiceName}},
) {}
}
