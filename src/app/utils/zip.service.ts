import { Injectable } from '@angular/core';
import JSZip from 'jszip';

@Injectable({
  providedIn: 'root',
})
export class ZipService {

  async createZip(files: Array<{ path: string, content: string }>): Promise<Blob> {
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.path, file.content);
    }

    return zip.generateAsync({ type: 'blob' });
  }
}
