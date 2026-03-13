import {Injectable} from '@angular/core';
import {EClassJson, EPackageJson} from './ecore-json';

@Injectable({
  providedIn: 'root',
})
export class RootFindingService {

  public determineRoot(model: EPackageJson): void {
    if (model.root) return;
    model.root = this.findRootEClass(model);
  }

  private findRootEClass(model: EPackageJson): EClassJson {
    const containedTargets = new Set<string>();

    // collect all types that are *contained by* others
    for (const cls of model.eClasses) {
      for (const ref of cls.references ?? []) {
        if (ref.containment && ref.resolvedType) {
          containedTargets.add(ref.resolvedType);
        }
      }
    }

    const roots: EClassJson[] = [];

    for (const cls of model.eClasses) {
      const hasSuperTypes = cls.superTypes && cls.superTypes.length > 0;
      const isContainedByOthers = containedTargets.has(cls.name);

      if (!hasSuperTypes && !isContainedByOthers) {
        roots.push(cls);
      }
    }
    if (roots.length === 0) {
      throw new Error(
        `No root EClass found. EMFular currently requires exactly one containment root.`
      );
    }

    if (roots.length > 1) {
      throw new Error(
        `Multiple root EClasses found: ${roots.join(
          ", "
        )}. EMFular currently requires exactly one root.`
      );
    }

    return roots[0];
  }



}
