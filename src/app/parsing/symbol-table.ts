export type ClassifierKind = 'EClass' | 'EEnum' | 'EDataType';
export type FeatureKind = 'EAttribute' | 'EReference';

/**
 * Map that ignores a single leading '#', so "#//@eClassifiers.1" and
 * "//@eClassifiers.1" (and "#_id" / "_id") address the same entry.
 */
export class RefIndex<T> {
  private readonly map = new Map<string, T>();

  private static key(raw: string): string {
    return raw.startsWith('#') ? raw.substring(1) : raw;
  }

  set(key: string, value: T): void {
    this.map.set(RefIndex.key(key), value);
  }

  get(key: string): T | undefined {
    return this.map.get(RefIndex.key(key));
  }

  has(key: string): boolean {
    return this.map.has(RefIndex.key(key));
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
  containment: boolean;
  id?: string;
  element: Element;
}

export interface IndexSet<T> {
  /** positional XPath: "//@eClassifiers.1", "/0/@eClassifiers.1" (+ "/0/URL" for multi-root) */
  byIndex: RefIndex<T>;
  /** name path: "//types/OrderStatus", "//Book/library" */
  byPath: RefIndex<T>;
  /** xmi:id */
  byId: RefIndex<T>;
}

export interface SymbolTable {
  classifiers: IndexSet<ClassifierSymbol>;
  features: IndexSet<FeatureSymbol>;
}

export function createSymbolTable(): SymbolTable {
  const set = <T>(): IndexSet<T> => ({
    byIndex: new RefIndex<T>(),
    byPath: new RefIndex<T>(),
    byId: new RefIndex<T>(),
  });
  return { classifiers: set(), features: set() };
}

/** Result of resolving a raw eType / eSuperTypes entry. */
export interface ClassifierRef {
  name: string;
  pkgPath?: string[];
  /** set for classifiers living in another metamodel (e.g. Ecore's EString) */
  pkgUri?: string;
  origin: 'local' | 'external' | 'unresolved';
}

export interface RootPackage {
  element: Element;
  /** undefined if the EPackage is the document root; index inside <xmi:XMI> otherwise */
  rootIndex?: number;
}
