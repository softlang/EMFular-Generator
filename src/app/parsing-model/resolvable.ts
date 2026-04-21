export enum RefFragmentKind {
  NameBased,     // #//A/b or other.ecore#//A/b
  Positional,    // #//@eClassifiers.2/@eStructuralFeatures.1
  IdBased        // #_abc123
}

export interface Resolvable {
  raw: string;
  resolved?: string;
}
