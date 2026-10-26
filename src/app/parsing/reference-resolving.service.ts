import { Injectable } from '@angular/core';
import {
  ClassifierKind,
  ClassifierRef,
  ClassifierSymbol,
  createSymbolTable,
  FeatureKind,
  FeatureSymbol,
  RootPackage,
  SymbolTable,
} from './symbol-table';

/**
 * The only place that knows about Ecore's referencing mechanisms:
 *   - positional XPath   "#//@eClassifiers.2/@eStructuralFeatures.0"
 *   - name path          "#//types/OrderStatus", "#//Book/library"
 *   - root index         "/0/URL", "#/0/@eClassifiers.1"
 *   - xmi:id             "#_id" and bare "_id"
 *   - external           "ecore:EDataType http://...Ecore#//EString"
 *   - legacy bare names  "ecore:Person"
 *
 * Phase 1: buildSymbolTable(doc) indexes everything.
 * Phase 2: resolveClassifier / resolveFeature answer lookups for any raw string.
 */
@Injectable({
  providedIn: 'root',
})
export class ReferenceResolvingService {
  // ---------------------------------------------------------------- phase 1

  /** Root packages in document order (one, or several inside <xmi:XMI>). */
  rootPackages(doc: Document): RootPackage[] {
    const docElem = doc.documentElement;
    if (this.isEPackage(docElem)) {
      return [{ element: docElem }];
    }
    const found: Element[] = [];
    const walk = (el: Element) => {
      if (this.isEPackage(el)) {
        found.push(el);
        return;
      }
      Array.from(el.children).forEach(walk);
    };
    walk(docElem);
    return found.map((element, rootIndex) => ({ element, rootIndex }));
  }

  buildSymbolTable(doc: Document): SymbolTable {
    const table = createSymbolTable();
    for (const { element, rootIndex } of this.rootPackages(doc)) {
      const base = rootIndex === undefined ? '//' : `/${rootIndex}/`;
      this.indexPackage(element, table, base, base, [], rootIndex !== undefined);
    }
    return table;
  }

  private indexPackage(
    pkg: Element,
    table: SymbolTable,
    posBase: string,
    nameBase: string,
    parentPath: string[],
    rootIndexed: boolean,
  ): void {
    const pkgPath = [...parentPath, pkg.getAttribute('name') ?? ''];
    let classifierIdx = 0;
    let subpackageIdx = 0;

    for (const child of Array.from(pkg.children)) {
      if (child.tagName === 'eClassifiers') {
        this.indexClassifier(
          child,
          classifierIdx++,
          table,
          posBase,
          nameBase,
          pkgPath,
        );
      } else if (child.tagName === 'eSubpackages') {
        const name = child.getAttribute('name') ?? '';
        this.indexPackage(
          child,
          table,
          `${posBase}@eSubpackages.${subpackageIdx++}/`,
          `${nameBase}${name}/`,
          pkgPath,
          rootIndexed,
        );
      }
    }
  }

  private indexClassifier(
    el: Element,
    idx: number,
    table: SymbolTable,
    posBase: string,
    nameBase: string,
    pkgPath: string[],
  ): void {
    const kind = this.typeOf(el) as ClassifierKind | undefined;
    if (kind !== 'EClass' && kind !== 'EEnum' && kind !== 'EDataType') return;

    const name = el.getAttribute('name') ?? '';
    const id = el.getAttribute('xmi:id') ?? undefined;
    const posPath = `${posBase}@eClassifiers.${idx}`;
    const namePath = `${nameBase}${name}`;

    const sym: ClassifierSymbol = {
      name,
      kind,
      pkgPath,
      id,
      element: el,
    };
    const c = table.classifiers;
    c.byIndex.set(posPath, sym);
    c.byPath.set(namePath, sym);
    if (id) c.byId.set(id, sym);

    if (kind !== 'EClass') return;

    let featureIdx = 0;
    for (const f of Array.from(el.children)) {
      if (f.tagName !== 'eStructuralFeatures') continue;
      const fKind = this.typeOf(f) as FeatureKind | undefined;
      const fPos = `${posPath}/@eStructuralFeatures.${featureIdx++}`;
      if (fKind !== 'EAttribute' && fKind !== 'EReference') continue;

      const fName = f.getAttribute('name') ?? '';
      const fId = f.getAttribute('xmi:id') ?? undefined;
      const fSym: FeatureSymbol = {
        name: fName,
        kind: fKind,
        ownerClassName: name,
        ownerPkgPath: pkgPath,
        containment: f.getAttribute('containment') === 'true',
        id: fId,
        element: f,
      };
      const fNamePath = `${namePath}/${fName}`;
      table.features.byIndex.set(fPos, fSym);
      table.features.byPath.set(fNamePath, fSym);
      if (fId) table.features.byId.set(fId, fSym);
    }
  }

  // ---------------------------------------------------------------- phase 2

  resolveClassifier(raw: string, table: SymbolTable): ClassifierRef {
    const { uri, fragment } = this.splitRef(raw);

    if (uri) {
      const name = this.lastSegment(fragment);
      return { name, pkgUri: uri, origin: 'external' };
    }

    const c = table.classifiers;
    const sym = c.byId.get(fragment) ?? c.byIndex.get(fragment) ?? c.byPath.get(fragment);
    if (sym) {
      return {
        name: sym.name,
        pkgPath: sym.pkgPath,
        origin: 'local',
      };
    }
    const name = this.lastSegment(fragment);
    return { name, origin: 'unresolved' };
  }

  resolveFeature(raw: string, table: SymbolTable): FeatureSymbol | undefined {
    const { uri, fragment } = this.splitRef(raw);
    if (uri) return undefined;
    const f = table.features;
    return f.byId.get(fragment) ?? f.byIndex.get(fragment) ?? f.byPath.get(fragment);
  }

  /** Last name segment of any raw reference; fallback for unresolved ones. */
  lastSegment(raw: string): string {
    const idx = Math.max(raw.lastIndexOf('/'), raw.lastIndexOf(':'));
    return idx >= 0 ? raw.substring(idx + 1) : raw;
  }

  // ---------------------------------------------------------------- helpers

  /** "ecore:EDataType http://x#//EString" -> {uri:'http://x', fragment:'//EString'} */
  private splitRef(raw: string): { uri?: string; fragment: string } {
    const token = (raw ?? '').trim().split(/\s+/).pop() ?? '';
    const hash = token.indexOf('#');
    if (hash > 0) {
      return { uri: token.substring(0, hash), fragment: token.substring(hash + 1) };
    }
    return { fragment: hash === 0 ? token.substring(1) : token };
  }

  private isEPackage(el: Element): boolean {
    return (
      el.tagName.endsWith('EPackage') || (el.getAttribute('xmi:type') ?? '').endsWith('EPackage')
    );
  }

  /** "ecore:EClass" -> "EClass" */
  private typeOf(el: Element): string | undefined {
    const t = el.getAttribute('xsi:type') ?? el.getAttribute('xmi:type');
    return t ? t.substring(t.indexOf(':') + 1) : undefined;
  }
}
