import {EPackageJson} from '../parsing-model/package';
import {RefFragmentKind} from '../parsing-model/resolvable';

export class ResolutionContext {

  pkgs: EPackageJson[];
  idMap: Map<string, string> = new Map<string, string>(); //id to eclass

  constructor(pkgs: EPackageJson[]) {
    this.pkgs = pkgs;
    for (const pkg of pkgs) {

    }
  }

  static classifyRefFragment(raw: string | undefined): RefFragmentKind | undefined {
    if (!raw) return undefined;
    // ID-based: starts with "#_" and has no slash
    if (raw.startsWith("#_")) {
      return RefFragmentKind.IdBased;
    }
    // Positional: contains "@eClassifiers." or "@eStructuralFeatures."
    if (raw.startsWith("#") &&
      (raw.includes("@eClassifiers.") || raw.includes("@eStructuralFeatures."))
    ) {
      return RefFragmentKind.Positional;
    }
    return RefFragmentKind.NameBased;
  }

}
