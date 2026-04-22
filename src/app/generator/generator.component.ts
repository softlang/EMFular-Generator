import {ChangeDetectorRef, Component} from '@angular/core';
import {NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ClassifierReference} from '../ecore-pipeline/generation-model/cross-references';
import {GeneratorService} from '../ecore-pipeline/generator.service';

@Component({
  selector: 'emfular-generator',
  standalone: true,
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.css'],
  imports: [
    NgIf,
    FormsModule
  ]
})
export class GeneratorComponent {
  fileName: string | null = null;
  errorMessage: string | null = null;

  rootByUser: string ="";
  packageByUser: string="";

  constructor(
    private generatorService: GeneratorService,
    private cdr: ChangeDetectorRef,
    ) {
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.processFile(file).finally(() => {
      input.value = ""; // reset AFTER async work
    });
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    this.processFile(file).finally(() => {
      const input = event.target as HTMLInputElement;
      input.value = ""; // reset AFTER async work
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private async processFile(file: File, projectName?: string) {
    this.errorMessage = null;
    const todoRootName = this.sanitize(this.rootByUser)
    const todoRoot: ClassifierReference|undefined = todoRootName?
      {name: todoRootName, path: [], uri_prefix: ""}: undefined

    try {
      await this.generatorService.processEcoreFile(
          file,
          projectName,
          todoRoot,
          this.sanitize(this.packageByUser)
      );
    } catch (e) {
      console.error("PROCESSING ERROR:", e);
      this.errorMessage = e instanceof Error ? e.message : String(e);
      this.cdr.detectChanges();
      return;
    }
  }

  private sanitize(str: string): string|undefined {
    const clean = str.trim()
    return clean.length<1? undefined: clean;
  }
}
