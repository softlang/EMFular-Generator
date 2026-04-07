import { Injectable } from '@angular/core';
import {EPackageJson} from './ecore-json';

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

  resolveSuperTypes(pkg: EPackageJson) {
    for (const cls of pkg.eClasses) {
      cls.superTypes2.map(sup => {
        const resolved = this.resolveSuperTypeUri(sup.originalRef, pkg)
        if (resolved) {
          sup.resolvedRef = {
            name: resolved
            //todo pkg?
          }
        }
      })
      cls.resolvedSuperTypes = cls.superTypes2
        .filter(sup => sup.resolvedRef != undefined)
        .map(ref => ref.resolvedRef!.name) // todo
    }
  }

  private resolveSuperTypeUri(uri: string, pkg: EPackageJson): string | undefined {
    // Case 1: XMI index "#/0/@eClassifiers.1"
    const match = uri.match(/@eClassifiers\.(\d+)/);
    if (match) {
      const index = Number(match[1]);
      const cls = pkg.eClasses.find(c => c._index === index);
      return cls?.name;
    }

    // Case 2: "#//Person" plus now also /1/Person
    if (uri.includes('/')) {
      const name = uri.split('/').pop()!;
      return pkg.eClasses.some(c => c.name === name) ? name : undefined;
    }
    //done also remove any /? since name is the last one behind it?

    // Case 3: "ecore:Person"
    if (uri.includes(':')) {
      const name = uri.split(':').pop()!;
      return pkg.eClasses.some(c => c.name === name) ? name : undefined;
    }
    return undefined;
  }

}
