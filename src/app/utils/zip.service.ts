import { Injectable } from '@angular/core';
import JSZip from 'jszip';

@Injectable({
  providedIn: 'root',
})
export class ZipService {

  private zip = new JSZip();

  addFile(path: string, content: string) {
    this.zip.file(path, content);
  }

  async finalize(): Promise<Blob> {
    return this.zip.generateAsync({ type: 'blob' });
  }

  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  async downloadZip(projectName: string): Promise<void> {
    const blob = await this.finalize();
    this.downloadBlob(blob, `${projectName}.zip`);
  }

}
