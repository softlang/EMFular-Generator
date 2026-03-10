import {Component} from '@angular/core';
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

  constructor(
    private generationService: GenerationService,
    private zipService: ZipService
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
    const finalProjectName = await this.generationService.processEcoreFile(file, projectName);
    await this.zipService.downloadZip(finalProjectName);
  }

}
