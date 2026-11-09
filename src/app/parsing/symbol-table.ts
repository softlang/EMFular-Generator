export type ClassifierKind = 'EClass' | 'EEnum' | 'EDataType';
export type FeatureKind = 'EAttribute' | 'EReference';
export type RefOrigin = 'local' | 'external' | 'unresolved';

/**
 * Map that ignores a single leading '#', so "#//@eClassifiers.1" and
 * "//@eClassifiers.1" (and "#_id" / "_id") address the same entry.
 */
export class RefIndex<T> {
  private readonly map = new Map<string, T>();

  private static key(raw: string): string {
    return raw.startsWith('#') ? raw.substring(1) : raw;
  }

  set(key: string, value: T): boolean {
    const k = RefIndex.key(key);
    const isNew = !this.map.has(k);
    this.map.set(k, value);
    return isNew;
  }

  get(key: string): T | undefined {
    return this.map.get(RefIndex.key(key));
  }
}

export interface ClassifierSymbol {
  name: string;
  kind: ClassifierKind;
  /** e.g. ['system', 'auth'] – root package first */
  pkgPath: string[];
  id?: string;
  element: Element;
}

export interface FeatureSymbol {
  name: string;
  kind: FeatureKind;
  ownerClassName: string;
  ownerPkgPath: string[];
  //todo missing? ownerNsURI: string;
  containment: boolean;
  id?: string;
  element: Element;
}

export interface IndexSet<T> {
  /** positional XPath: "//@eClassifiers.1", "/0/@eClassifiers.1"  */
  byIndex: RefIndex<T>;
  /** name path: "//types/OrderStatus", "//Book/library" (+ "/0/URL" for multi-root) */
  byPath: RefIndex<T>;
  /** xmi:id */
  byId: RefIndex<T>;
}

export interface ParseWarning {
  code:
    | 'unresolved-reference'
    | 'missing-reference'
    | 'duplicate-key'
    | 'unknown-element-type'
    | 'no-package';
  message: string;
  location?: string;
}

export interface SymbolTable {
  classifiers: IndexSet<ClassifierSymbol>;
  features: IndexSet<FeatureSymbol>;
  nsUris: Set<string>;
  warnings: ParseWarning[];
}

export function createSymbolTable(): SymbolTable {
  const set = <T>(): IndexSet<T> => ({
    byIndex: new RefIndex<T>(),
    byPath: new RefIndex<T>(),
    byId: new RefIndex<T>(),
  });
  return { classifiers: set(), features: set(), nsUris: new Set<string>(), warnings: [] };
}

export interface RootPackage {
  element: Element;
  /** undefined if the EPackage is the document root; index inside <xmi:XMI> otherwise */
  rootIndex?: number;
}
