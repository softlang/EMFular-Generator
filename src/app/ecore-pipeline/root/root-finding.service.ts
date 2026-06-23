import {Injectable} from '@angular/core';
import {EPackageJson} from '../parsing-model/package';
import {EClassJson} from '../parsing-model/classifier';
import {RootSelectionDialogComponent} from './root-selection-dialog/root-selection-dialog.component';
import {firstValueFrom} from 'rxjs';
import {MatDialog} from '@angular/material/dialog';
import {EClassManager} from '../../eclass/eclass-manager';
import {RootFindingClsModel, RootFindingPkgModel} from './root-finding-cls-model';

@Injectable({
  providedIn: 'root',
})
export class RootFindingService {

  constructor(
    private dialog: MatDialog,
  ) {}

  public async determineRoot(pkgs: EPackageJson[], rootEclassByUser?: string): Promise<string> {
    if(rootEclassByUser) {
      return rootEclassByUser;
    } else {
      //first reduce model to root candidates (no interfaces) in the necesaary form
      const pickPkgs = this.toRootFindingPkgModel(pkgs);

      //then check if there is only one real candidate - if yes, use it, else ask the user.
      const justOne = this.justOne(pickPkgs);
      if (justOne) {
        return justOne;
      }
      const pickedRoot: string | null =  await this.pickRoot(pickPkgs)
      if (pickedRoot) {
        return pickedRoot;
      } else {
        throw new Error('No root picked from ' + pkgs.map(pkg => pkg.name));
      }
    }
  }

  public toRootFindingPkgModel(pkgs: EPackageJson[]): RootFindingPkgModel[] {
    return pkgs.map(pkg => {
        return {
          name: pkg.name,
          classes: pkg.eClasses.map(cls =>
            this.toRootFindingClsModel(pkg.nsURI, cls)
          ).filter(cls => cls!=undefined)
        }
    })
  }

  private toRootFindingClsModel( pkgUri: string, cls: EClassJson,): RootFindingClsModel|undefined {
    if (cls.interfaceLike) {
      return undefined
    }
    return {
      eClass: EClassManager.createEClassFromPkgStr(pkgUri, cls),
      name: cls.name,
      abstract: cls.abstract,
      hasContainment: this.hasContainment(cls),
      allFeaturesTransient: this.allFeaturesTransient(cls)
    }
  }

  private hasContainment(cls: EClassJson): boolean {
    return cls.references?.some(r => r.containment) ?? false;
  }

  private allFeaturesTransient(cls: EClassJson): boolean {
    return cls.references?.every(r => r.transient) ?? false;
  }

  private justOne(pkgs: RootFindingPkgModel[]): string | null {
    let res: string |null = null;
    for (const pkg of pkgs) {
      for (const cls of pkg.classes) {
        if (res != null){
          //there is already one other class:
          return null
        }   else {
          res = cls.eClass
        }
      }
    }
    //if res is still null, then there are even no candidates
    if (res == null){
      throw new Error('No usable root classes found');
    }
    return res
  }

  async pickRoot(candidates: RootFindingPkgModel[]): Promise<string | null> {
    const dialogRef = this.dialog.open(RootSelectionDialogComponent, {
      data: candidates,
    });
    return await firstValueFrom(dialogRef.afterClosed());
  }

}
