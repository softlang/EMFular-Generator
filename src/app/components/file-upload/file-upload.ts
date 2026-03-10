import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { EcoreParserService } from '../../services/ecore-parser';
import { EclassesGeneratorService } from '../../services/eclasses-generator';
import { ModelGeneratorService } from '../../services/model-generator';
import { TemplateJsonGeneratorService } from '../../services/template-json-generator';
import { FileDownloadService } from '../../services/file-download';
import { AppComponentGeneratorService } from "../../services/app-component-generation"
import {
  ZipExportService,
  AssetZipFile,
  GeneratedZipFile,
} from '../../services/zip-export';

@Component({
  selector: 'file-upload',
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css',
})
export class FileUploadCompontent {
  selectedFile: File | null = null;

  /**
   * path to JSON-file, with a list of all static files from the template
   */
  private readonly exportTemplateManifestPath = 'assets/export-template/files.json';

  constructor(
    private http: HttpClient,
    private ecoreParser: EcoreParserService,
    private eclassesGenerator: EclassesGeneratorService,
    private modelGenerator: ModelGeneratorService,
    private templateJsonGenerator: TemplateJsonGeneratorService,
    private fileDownload: FileDownloadService,
    private appComponentGenerator: AppComponentGeneratorService,
    private zipExportService: ZipExportService
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedFile) {
      alert('Bitte zuerst eine Datei auswählen.');
      return;
    }

    try {
      const parsedModel = await this.parseSelectedFile();

      const eclassesTs = this.eclassesGenerator.generate(parsedModel);

      const modelTs = this.modelGenerator.generate(parsedModel);

      const appComponentTs = this.appComponentGenerator.generate(parsedModel);
      
      const templateJson = this.templateJsonGenerator.generate(parsedModel);
    

      /**
       * 1) load static files from files.json 
       *    e.g.:
       *    ".editorconfig" -> assetPath: "export-template/.editorconfig"
       *                     -> zipPath:   ".editorconfig"
       */
      const assetFiles = await this.buildAssetFilesFromManifest();
      console.log("assetfies: ", assetFiles)
      /**
       * 2) define generated files
       */
      const generatedFiles: GeneratedZipFile[] = [
        {
          zipPath: `src/app/app.component.ts`,
          content: appComponentTs,
        },
        {
          zipPath: `src/app/shared/${this.extractName(parsedModel.nsURI)}/eclasses.ts`,
          content: eclassesTs,
        },
        {
          zipPath: `src/app/shared/${this.extractName(parsedModel.nsURI)}/core/model.ts`,
          content: modelTs,
        },
        {
          zipPath: `src/app/shared/${this.extractName(parsedModel.nsURI)}/json/template.json`,
          content: templateJson,
          mimeType: 'application/json;charset=utf-8',
        },
      ];
      console.log("TEST")

      const baseFileName = this.removeFileExtension(this.selectedFile.name);
      const zipFileName = `${baseFileName}.zip`;

      await this.zipExportService.exportZip(
        zipFileName,
        assetFiles,
        generatedFiles
      );
    } catch (error) {
      console.error('Fehler beim Erstellen der ZIP-Datei:', error);
      alert('Die Datei konnte nicht verarbeitet oder exportiert werden.');
    }
  }

  async downloadOnlyModel(): Promise<void> {
    if (!this.selectedFile) return;

    const parsedModel = await this.parseSelectedFile();
    const modelTs = this.modelGenerator.generate(parsedModel);

    this.fileDownload.download('model.ts', modelTs);
  }

  async downloadOnlyEclasses(): Promise<void> {
    if (!this.selectedFile) return;

    const parsedModel = await this.parseSelectedFile();
    const eclassesTs = this.eclassesGenerator.generate(parsedModel);

    this.fileDownload.download('eclasses.ts', eclassesTs);
  }

  async downloadOnlyTemplateJson(): Promise<void> {
    if (!this.selectedFile) return;

    const parsedModel = await this.parseSelectedFile();
    const templateJson = this.templateJsonGenerator.generate(parsedModel);

    this.fileDownload.download(
      'template.json',
      templateJson,
      'application/json;charset=utf-8'
    );
  }

  private async parseSelectedFile(): Promise<any> {
    if (!this.selectedFile) {
      throw new Error('Es wurde keine Datei ausgewählt.');
    }

    const xml = await this.selectedFile.text();
    return this.ecoreParser.parse(xml);
  }

  private extractName(input: string): string | null {
    const match = input.match(/^http:\/\/([^#]+)/);
    return match ? match[1] : null;
  }

  private async buildAssetFilesFromManifest(): Promise<AssetZipFile[]> {
    console.log("Test")
    const templateFiles = await firstValueFrom(
      this.http.get<string[]>(this.exportTemplateManifestPath)
    );
    console.log("template files: ", templateFiles)

    return templateFiles.map((relativePath) => ({
      /**
       * source in angular-assets-folder:
       * assets/export-template/<relativePath>
       */
      assetPath: `export-template/${relativePath}`,

      /**
       * target path in ZIP:
       * as defined in files.json 
       */
      zipPath: relativePath,
    }));
  }

  private removeFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  }
}