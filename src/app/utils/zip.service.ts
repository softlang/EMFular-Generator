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

}
