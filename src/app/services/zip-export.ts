import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { firstValueFrom } from 'rxjs';

export interface GeneratedZipFile {
  zipPath: string;
  content: string | Blob | ArrayBuffer | Uint8Array;
  mimeType?: string;
}

export interface AssetZipFile {
  assetPath: string; // source-path in src/assets/...
  zipPath: string;   // target-path in ZIP
  responseType?: 'text' | 'blob';
}

@Injectable({
  providedIn: 'root',
})
export class ZipExportService {
  constructor(private http: HttpClient) {}

  /**
   * generates ZIP from:
   * - static files from assets
   * - generated files
   */
  async exportZip(
    zipFileName: string,
    assetFiles: AssetZipFile[],
    generatedFiles: GeneratedZipFile[]
  ): Promise<void> {
    const zip = new JSZip();

    // 1) load static files form assets and add to zip
    for (const file of assetFiles) {
      await this.addAssetFileToZip(zip, file);
    }

    // 2) add generated files to zip
    for (const file of generatedFiles) {
      this.addGeneratedFileToZip(zip, file);
    }

    // 3) generate zip
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // 4) download
    saveAs(zipBlob, zipFileName);
  }

  private async addAssetFileToZip(zip: JSZip, file: AssetZipFile): Promise<void> {
    const responseType = file.responseType ?? this.detectResponseType(file.assetPath);

    if (responseType === 'blob') {
      const blob = await firstValueFrom(
        this.http.get(`assets/${file.assetPath}`, { responseType: 'blob' })
      );
      zip.file(file.zipPath, blob);
      return;
    }

    const text = await firstValueFrom(
      this.http.get(`assets/${file.assetPath}`, { responseType: 'text' })
    );
    zip.file(file.zipPath, text);
  }

  private addGeneratedFileToZip(zip: JSZip, file: GeneratedZipFile): void {
    if (typeof file.content === 'string') {
      zip.file(file.zipPath, file.content);
      return;
    }

    zip.file(file.zipPath, file.content);
  }

  private detectResponseType(path: string): 'text' | 'blob' {
    const lower = path.toLowerCase();

    if (
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.pdf') ||
      lower.endsWith('.zip') ||
      lower.endsWith('.woff') ||
      lower.endsWith('.woff2')
    ) {
      return 'blob';
    }

    return 'text';
  }
}