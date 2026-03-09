import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TemplateLoadService {

  private basePath = 'templates/';

  async loadTemplate(path: string): Promise<string> {
    const response = await fetch(this.basePath + path);
    return response.text();
  }
}
