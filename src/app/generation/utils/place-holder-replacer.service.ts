import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PlaceholderReplacerService {

  applyPlaceholders(content: string, params: Record<string, string>): string {
    let result = content;

    for (const [key, value] of Object.entries(params)) {
      const pattern = new RegExp(`%%${key}%%`, 'g');
      result = result.replace(pattern, value);
    }

    return result;
  }
}
