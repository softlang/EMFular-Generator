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
    const all = new Set(model.eClasses.map(c => c.name));
    const contained = new Set<string>();

    for (const cls of model.eClasses) {
      for (const ref of cls.references) {
        if (ref.containment && ref.resolvedType) {
          contained.add(ref.resolvedType);
        }
      }
    }

    const roots = [...all].filter(name => !contained.has(name));

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

    return model.eClasses.find(
      c => c.name === roots[0]
    )!;
  }



}
