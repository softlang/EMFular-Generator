import {Injectable} from '@angular/core';
import {EClassJson, EPackageJson} from '../../parsing/ecore-json';

@Injectable({
  providedIn: 'root',
})
export class RootFindingService {

  public allPossibleRootClasses(model: EPackageJson): EClassJson[] {
    return model.eClasses.filter(
      cls =>
        !cls.abstract
        && cls.interfaceLike !== true
    )
  }

  public findRootEClassCandidates(model: EPackageJson): EClassJson[] {
    // 1. Collect all types that are containment targets (ignore self-containment)
    const containedTargets = new Set<string>();

    for (const cls of model.eClasses) {
      for (const ref of cls.references ?? []) {
        if (ref.containment && ref.resolvedType && ref.resolvedType !== cls.name) {
          containedTargets.add(ref.resolvedType);
        }
      }
    }

    // 2. Precompute immediate subtypes ("children")
    const children = new Map<string, string[]>();
    for (const cls of model.eClasses) {
      for (const sup of cls.resolvedSuperTypes ?? []) {
        const arr = children.get(sup) ?? [];
        arr.push(cls.name);
        children.set(sup, arr);
      }
    }

    // 3. fixed point over containedTargets to find recursivly contained targets,
    //i.e. recursive sub- and supertypes
    let ctsize = 0;
    while(containedTargets.size > ctsize) {
      ctsize = containedTargets.size;
      for (const cls of model.eClasses) {
        if (
          cls.resolvedSuperTypes.some(sup => containedTargets.has(sup))
        ) {
          containedTargets.add(cls.name)
        }
        const ownChildren: string[] | undefined = children.get(cls.name)
        if(ownChildren
          && ownChildren.length > 0
          && ownChildren.every(child => containedTargets.has(child))
        ) {
          containedTargets.add(cls.name)
        }
      }
    }

    // 4. Root candidates: non-abstract, non-interface, NOT contained (directly or via ancestors)
    const roots = model.eClasses.filter(cls =>
      !cls.abstract && cls.interfaceLike !== true &&
      !(containedTargets.has(cls.name))
    );

    return roots
  }

  public determineUniqueRoot(roots: EClassJson[]): EClassJson {
    if (roots.length === 0) {
      throw new Error(
        `No root EClass found. A root must be non-abstract, non-interface, and not contained (directly or via ancestors) by any other class.`
      );
    }

    if (roots.length > 1) {
      throw new Error(
        `Multiple root EClasses found: ${roots.map(r => r.name).join(
          ", "
        )}. EMFular currently requires exactly one root.`
      );
    }

    return roots[0];
  }


}
