import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ReferenceResolvingService {

  normalizeIdRef(raw: string): string {
    if (!raw) return raw;
    let id = raw;
    if (id.startsWith('#')) {
      id = id.substring(1);
    }
    return id;
  }

  normalizeTypeName(raw: string): string {
    const idx = raw.lastIndexOf("/"); //not #// to work with older models
    return idx >= 0 ? raw.substring(idx + 1) : raw;
  }

}
