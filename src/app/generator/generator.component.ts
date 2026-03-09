import {Component} from '@angular/core';
import {NgIf} from '@angular/common';

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
  fileContent: string | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.readFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    this.readFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private readFile(file: File) {
    this.fileName = file.name;

    const reader = new FileReader();
    reader.onload = () => {
      this.fileContent = reader.result as string;
      // TODO: parse Ecore here
    };
    reader.readAsText(file);
  }
}
