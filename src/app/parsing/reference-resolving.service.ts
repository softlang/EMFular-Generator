import { Injectable } from '@angular/core';
import {EClassJson, EPackageJson, EReferenceJson, RefFragmentKind, Resolvable} from './ecore-json';

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
      this.resolveOnClass(cls, idToMap)
    })
  }

  private resolveOnClass(cls: EClassJson, idToName: Map<string, string>) {
    //todo collect imports?
    cls.attributes.forEach(attr => {
      this.resolveType(attr.type, idToName)
    })
    cls.references.forEach(reference => {
      this.resolveType(reference.type, idToName)
      this.resolveOpposite(reference)
    })
  }

  private resolveType(attr: Resolvable, idToName: Map<string,string>){
    attr.resolved = this.resolveByIdMap(attr.raw, idToName)
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

  classifyRefFragment(raw: string | undefined): RefFragmentKind | undefined {
    if (!raw) return undefined;
    // ID-based: starts with "#_" and has no slash
    if (raw.startsWith("#_")) {
      return RefFragmentKind.IdBased;
    }
    // Positional: contains "@eClassifiers." or "@eStructuralFeatures."
    if (raw.includes("@eClassifiers.") || raw.includes("@eStructuralFeatures.")) {
      return RefFragmentKind.Positional;
    }
    return RefFragmentKind.NameBased;
  }

  //we can resolve without context, since we do neither expect id-based, nor positional references
  resolveOpposite(ref: EReferenceJson) {
    const raw = ref.opposite?.raw
    const oppositeKind = this.classifyRefFragment(raw)
    if (oppositeKind == RefFragmentKind.IdBased || oppositeKind == RefFragmentKind.Positional ) {
      throw new Error("Id based or positional opposite relationships are not supported.")
    }
    if (!raw ) return;
    const idx = raw.lastIndexOf("/");
    ref.opposite!.resolved =  idx >= 0 ? raw.substring(idx + 1) : raw;
  }
}
