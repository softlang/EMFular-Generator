import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TemplateLoadService {

  async loadTemplate(path: string): Promise<string> {
    const response = await fetch( path);
    return response.text();
  }
}
