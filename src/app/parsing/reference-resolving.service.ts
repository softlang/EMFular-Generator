import { Injectable } from '@angular/core';
import {
  ClassifierKind,
  ClassifierSymbol,
  createSymbolTable,
  FeatureKind,
  FeatureSymbol,
  IndexSet,
  ParseWarning,
  RefIndex,
  RootPackage,
  SymbolTable,
} from './symbol-table';
import {ClassifierRef, FeatureRef} from './ecore-json';

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
      this.indexPackage(element, table, base, base, []);
    }
    return table;
  }

  private indexPackage(
    pkg: Element,
    table: SymbolTable,
    posBase: string,
    nameBase: string,
    parentPath: string[]
  ): void {
    const pkgPath = [...parentPath, pkg.getAttribute('name') ?? ''];
    const nsUri = pkg.getAttribute('nsURI');
    if (nsUri) table.nsUris.add(nsUri);

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
          pkgPath
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
    this.register(c.byIndex, posPath, sym, table, el);
    this.register(c.byPath, namePath, sym, table, el);
    if (id) this.register(c.byId, id, sym, table, el);

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
      this.register(table.features.byIndex, fPos, fSym, table, f);
      this.register(table.features.byPath, `${namePath}/${fName}`, fSym, table, f);
      if (fId) this.register(table.features.byId, fId, fSym, table, f);
    }
  }

  private register<T>(
    index: RefIndex<T>,
    key: string,
    sym: T,
    table: SymbolTable,
    from: Element
  ): void {
    if (!index.set(key, sym)) {
      this.addWarning(
        table,
        'duplicate-key',
        `Duplicate reference key '${key}': the later definition replaces the earlier one`,
        from
      );
    }
  }

  // ---------------------------------------------------------------- phase 2

  resolveClassifier(raw: string, table: SymbolTable, from?: Element): ClassifierRef {
    const { uri, fragment } = this.splitRef(raw);

    if (uri && !table.nsUris.has(uri)) {
      return { name: this.nameOf(fragment), pkgUri: uri, origin: 'external' };
    }

    const sym = this.lookup(table.classifiers, fragment);
    if (sym) {
      return { name: sym.name, pkgPath: sym.pkgPath, origin: 'local' };
    }

    this.warnUnresolved(raw, table, from);
    return { name: this.nameOf(fragment), origin: 'unresolved' };
  }

  resolveFeature(raw: string, table: SymbolTable, from?: Element): FeatureRef {
    const { uri, fragment } = this.splitRef(raw);

    if (uri && !table.nsUris.has(uri)) {
      return {
        name: this.nameOf(fragment),
        resolvedClass: {
          name: '', //todo last but one fragment? maybe more for path?
          pkgUri: uri,
          origin: 'external'
        }
      };
    }

    const sym = this.lookup(table.features, fragment);
    if (sym) {
      return {
        name: sym.name,
        resolvedClass: {
          name: sym.ownerClassName,
          pkgPath: sym.ownerPkgPath,
          //todo pkgUri: sym.???
          origin: 'local'
        },
        containment: sym.containment,
      };
    }

    this.warnUnresolved(raw, table, from);
    return {
      name: this.nameOf(fragment),
      resolvedClass: {
        name: '',
        origin: 'unresolved'
      }
    };
  }

  addWarning(
    table: SymbolTable,
    code: ParseWarning['code'],
    message: string,
    from?: Element
  ): void {
    table.warnings.push({ code, message, location: from ? this.describe(from) : undefined })
  }

  // ---------------------------------------------------------------- helpers

  private lookup<T>(index: IndexSet<T>, fragment: string): T | undefined {
    return index.byId.get(fragment) ?? index.byIndex.get(fragment) ?? index.byPath.get(fragment);
  }

  private warnUnresolved(raw: string, table: SymbolTable, from?: Element): void {
    if (!raw.trim()) {
      this.addWarning(table, 'missing-reference', 'Reference is empty', from);
    } else {
      this.addWarning(table, 'unresolved-reference', `Could not resolve reference '${raw}'`, from)
    }
  }

  private describe(el: Element): string {
    const names: string[] = [];
    for (let cur: Element | null = el; cur; cur = cur.parentElement) {
      const n = cur.getAttribute('name');
      if (n) names.unshift(n);
    }
    return names.join('.');
  }

  private nameOf(fragment: string): string {
    const idx = Math.max(fragment.lastIndexOf('/'), fragment.lastIndexOf(':'));
    const last = idx >= 0 ? fragment.substring(idx + 1) : fragment;
    return last.startsWith('@') ? '' : last;
  }

  /** "ecore:EDataType http://x#//EString" -> {uri:'http://x', fragment:'//EString'} */
  private splitRef(raw: string): { uri?: string; fragment: string } {
    const token = (raw ?? '').trim().split(/\s+/).pop() ?? '';
    const hash = token.indexOf('#');
    if (hash > 0) {
      return { uri: token.substring(0, hash), fragment: token.substring(hash + 1) };
    }
    return { fragment: hash === 0 ? token.substring(1) : token };
  }

  public splitRefList(raw: string): string[] {
    const tokens = raw.split(/\s+/).filter(Boolean);
    const result: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const isTypePrefix =
        tokens[i].includes(':') &&
        !tokens[i].includes('#') &&
        !tokens[i].includes('/') &&
        tokens[i + 1]?.includes('#');
      if (isTypePrefix) {
        result.push(`${tokens[i]} ${tokens[i + 1]}`); // "ecore:EClass http://…#//EObject"
        i++;
      } else {
        result.push(tokens[i]);
      }
    }
    return result;
  }

  private isEPackage(el: Element): boolean {
    return el.tagName.endsWith('EPackage') || this.typeOf(el) === 'EPackage';
  }

  /** "ecore:EClass" -> "EClass" */
  public typeOf(el: Element): string | undefined {
    const t = el.getAttribute('xsi:type') ?? el.getAttribute('xmi:type');
    return t ? t.substring(t.indexOf(':') + 1) : undefined;
  }
}
