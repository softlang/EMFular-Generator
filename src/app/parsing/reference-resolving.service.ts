import { Injectable } from '@angular/core';
import {EAttributeJson, EClassJson, EPackageJson, EReferenceJson} from './ecore-json';

@Injectable({
  providedIn: 'root',
})
export class ReferenceResolvingService {

  resolveOnPkg(pkg: EPackageJson) {
    const idToMap: Map<string, string> = new Map();
    pkg.eClasses.forEach(eClass => {
      if (eClass._id) {
        idToMap.set(eClass._id, eClass.name); //todo we could have a map between cls and raw string
      }
    })

    pkg.eClasses.forEach((cls: EClassJson) => {
      this.resolveTypes(cls, idToMap)
    })
  }

  private resolveTypes(cls: EClassJson, idToName: Map<string, string>) {
    //todo collect imports?
    cls.attributes.forEach(attr => {
      this.resolveType(attr, idToName)
    })
    cls.references.forEach(reference => {
      this.resolveType(reference, idToName)
    })
  }

  private resolveType(attr: EAttributeJson|EReferenceJson, idToName: Map<string,string>){
    attr.resolvedType = this.resolveByIdMap(attr.type, idToName)
  }

  private resolveByIdMap(rawType: string, idToName: Map<string,string>) {
    return idToName.get(
      this.normalizeIdRef(rawType)
    ) ?? this.normalizeTypeName(rawType)
  }

  private normalizeIdRef(raw: string): string {
    if (!raw) return raw;
    let id = raw;
    if (id.startsWith('#')) {
      id = id.substring(1);
    }
    return id;
  }

  private normalizeTypeName(raw: string): string {
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
