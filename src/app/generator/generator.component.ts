import {ChangeDetectorRef, Component} from '@angular/core';
import {NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
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

  projectByUser: string ="";
  rootByUser: string ="";
  mainFolderByUser: string="";

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

  private async processFile(file: File) {
    this.errorMessage = null;

    try {
      await this.generatorService.processEcoreFile(
        file,
        this.sanitize(this.projectByUser),
        this.sanitize(this.mainFolderByUser),
        this.sanitize(this.rootByUser)
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
