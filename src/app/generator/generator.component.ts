import {ChangeDetectorRef, Component} from '@angular/core';
import {GenerationService} from '../generation/generation.service';
import {ZipService} from '../generation/utils/zip.service';
import {FormsModule} from '@angular/forms';
import {EPackageJson} from '../parsing/ecore-json';
import {Ecore2JsonService} from '../parsing/ecore2json.service';

@Component({
  selector: 'emfular-generator',
  standalone: true,
  templateUrl: './generator.component.html',
  styleUrls: ['./generator.component.css'],
  imports: [
    FormsModule,
  ]
})
export class GeneratorComponent {
  fileName: string | null = null;
  errorMessage: string | null = null;

  projectName: string ="";
  modelName: string = "";
  rootByUser: string ="";
  packageByUser: string="";

  constructor(
    private ecore2jsonService: Ecore2JsonService,
    private generationService: GenerationService,
    private zipService: ZipService,
    private cdr: ChangeDetectorRef,
    ) {
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.processFile(file, this.projectName).finally(() => {
      input.value = ""; // reset AFTER async work
    });

  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;

    this.processFile(file, this.projectName).finally(() => {
      const input = event.target as HTMLInputElement;
      input.value = ""; // reset AFTER async work
    });
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private async processFile(file: File, projectName?: string, modelName?: string) {
    this.errorMessage = null;

    try {
      const xml = await this.readFile(file);
      const models: EPackageJson[] = this.ecore2jsonService.parse(xml)

      const finalProjectName =
        await this.generationService.processEcoreFile(
          models,
          projectName,
          modelName,
          this.sanitize(this.rootByUser),
          this.sanitize(this.packageByUser)
        );
      await this.zipService.downloadZip(finalProjectName);

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

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}
