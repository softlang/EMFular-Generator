import {ChangeDetectorRef, Component} from '@angular/core';
import {NgIf} from '@angular/common';
import {GenerationService} from '../generation.service';
import {ZipService} from '../../utils/zip.service';

@Component({
  selector: 'emfular-generator',
  standalone: true,
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.css'],
  imports: [
    NgIf
  ]
})
export class GeneratorComponent {
  fileName: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private generationService: GenerationService,
    private zipService: ZipService,
    private cdr: ChangeDetectorRef,
    ) {
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.processFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    this.processFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private async processFile(file: File, projectName?: string) {
    this.errorMessage = null;

    try {
      const finalProjectName =
        await this.generationService.processEcoreFile(file, projectName);

      await this.zipService.downloadZip(finalProjectName);

    } catch (e) {
      console.error("PROCESSING ERROR:", e);
      this.errorMessage = e instanceof Error ? e.message : String(e);
      this.cdr.detectChanges();
      return;
    }
  }

}
